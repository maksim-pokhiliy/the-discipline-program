import { type TiptapNode } from "@repo/contracts/common/tiptap-doc";
import { SchemeSectionKind, WorkoutRepScheme } from "@repo/contracts/lms/workout-block";
import { BadRequestError } from "@repo/errors";

import {
  EMOM_SLOT_NODE_TYPE,
  emomSlotAttrsSchema,
  EXERCISE_LINE_NODE_TYPE,
  EXERCISE_MENTION_NODE_TYPE,
  exerciseLineAttrsSchema,
  exerciseMentionAttrsSchema,
  NOTES_SECTION_NODE_TYPE,
  notesSectionAttrsSchema,
  SCHEME_SECTION_NODE_TYPE,
  schemeSectionAttrsSchema,
  TEXT_CALLOUT_SECTION_NODE_TYPE,
  textCalloutSectionAttrsSchema,
  toNodePath,
} from "./parser-schemas";
import {
  type EmomSlotInput,
  type LibraryLookup,
  type ParseWorkoutDocOptions,
  type SchemeSectionInput,
  type WorkoutBlockExerciseInput,
} from "./parser-types";

const DEFAULT_TEXT_CALLOUT_TONE = "info";

const parseExerciseMention = (
  node: TiptapNode,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
  path: string,
  sortOrder: number,
): WorkoutBlockExerciseInput => {
  if (node.type !== EXERCISE_MENTION_NODE_TYPE) {
    throw new BadRequestError("Expected exerciseMention node", { path, nodeType: node.type });
  }

  const parsed = exerciseMentionAttrsSchema.safeParse(node.attrs ?? {});

  if (!parsed.success) {
    throw new BadRequestError("Invalid exerciseMention attrs", {
      path,
      issues: parsed.error.issues,
    });
  }

  const attrs = parsed.data;
  const entry = lookup.exercisesById.get(attrs.exerciseId);

  if (!entry) {
    throw new BadRequestError("Referenced exerciseId not found in library", {
      path,
      exerciseId: attrs.exerciseId,
    });
  }

  if (entry.status !== "APPROVED" && entry.createdByUserId !== opts.savingCoachUserId) {
    throw new BadRequestError(
      "Referenced exercise is not APPROVED and not owned by the saving coach",
      { path, exerciseId: attrs.exerciseId, status: entry.status },
    );
  }

  const repValues = attrs.repValues ?? [];
  const sets = attrs.sets ?? (repValues.length > 0 ? repValues.length : null);

  return {
    exerciseId: attrs.exerciseId,
    repScheme: attrs.repScheme ?? WorkoutRepScheme.STRAIGHT,
    repValues,
    sets,
    prescription: attrs.prescription ?? null,
    restSec: attrs.restSec ?? null,
    note: attrs.note ?? null,
    complexGroup: attrs.complexGroup ?? null,
    complexOrder: attrs.complexOrder ?? null,
    sortOrder,
  };
};

const parseExerciseLineNode = (
  node: TiptapNode,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
  path: string,
  startSortOrder: number,
): WorkoutBlockExerciseInput[] => {
  if (node.type !== EXERCISE_LINE_NODE_TYPE) {
    throw new BadRequestError("Expected exerciseLine node", { path, nodeType: node.type });
  }

  const parsedAttrs = exerciseLineAttrsSchema.safeParse(node.attrs ?? {});

  if (!parsedAttrs.success) {
    throw new BadRequestError("Invalid exerciseLine attrs", {
      path,
      issues: parsedAttrs.error.issues,
    });
  }

  const mentions: WorkoutBlockExerciseInput[] = [];
  let sortOrder = startSortOrder;

  (node.content ?? []).forEach((child, idx) => {
    if (child.type !== EXERCISE_MENTION_NODE_TYPE) {
      return;
    }

    const childPath = toNodePath(path, "content", idx);

    mentions.push(parseExerciseMention(child, lookup, opts, childPath, sortOrder));
    sortOrder += 1;
  });

  return mentions;
};

const parseEmomSlotNode = (
  node: TiptapNode,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
  path: string,
  sortOrder: number,
): EmomSlotInput => {
  if (node.type !== EMOM_SLOT_NODE_TYPE) {
    throw new BadRequestError("Expected emomSlot node", { path, nodeType: node.type });
  }

  const parsed = emomSlotAttrsSchema.safeParse(node.attrs ?? {});

  if (!parsed.success) {
    throw new BadRequestError("Invalid emomSlot attrs", { path, issues: parsed.error.issues });
  }

  const exercises: WorkoutBlockExerciseInput[] = [];
  let mentionSortOrder = 0;

  (node.content ?? []).forEach((child, idx) => {
    if (child.type !== EXERCISE_MENTION_NODE_TYPE) {
      return;
    }

    const childPath = toNodePath(path, "content", idx);

    exercises.push(parseExerciseMention(child, lookup, opts, childPath, mentionSortOrder));
    mentionSortOrder += 1;
  });

  if (exercises.length === 0 && opts.strict === true) {
    throw new BadRequestError("emomSlot must contain at least one exerciseMention", {
      code: "workout.emomSlot.empty",
      path,
    });
  }

  return {
    minuteInRound: parsed.data.minuteInRound,
    sortOrder,
    note: parsed.data.note ?? null,
    exercises,
  };
};

const parseSchemeSectionNode = (
  node: TiptapNode,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
  path: string,
  sectionIndex: number,
): SchemeSectionInput => {
  const parsed = schemeSectionAttrsSchema.safeParse(node.attrs ?? {});

  if (!parsed.success) {
    throw new BadRequestError("Invalid schemeSection attrs", {
      path,
      issues: parsed.error.issues,
    });
  }

  const attrs = parsed.data;

  if (
    attrs.schemeId !== null &&
    attrs.schemeId !== undefined &&
    !lookup.schemeIds.has(attrs.schemeId)
  ) {
    throw new BadRequestError("Referenced schemeId not found in library", {
      path,
      schemeId: attrs.schemeId,
    });
  }

  const exercises: WorkoutBlockExerciseInput[] = [];
  const emomSlots: EmomSlotInput[] = [];

  if (attrs.schemeKind === "EMOM") {
    (node.content ?? []).forEach((child, idx) => {
      const childPath = toNodePath(path, "content", idx);

      if (child.type !== EMOM_SLOT_NODE_TYPE) {
        throw new BadRequestError("Expected emomSlot child inside EMOM schemeSection", {
          path: childPath,
          nodeType: child.type,
        });
      }

      emomSlots.push(parseEmomSlotNode(child, lookup, opts, childPath, idx));
    });

    if (emomSlots.length === 0 && opts.strict === true) {
      throw new BadRequestError("EMOM section must contain at least one emomSlot", {
        code: "workout.section.emom.empty",
        path,
      });
    }
  } else {
    let runningSortOrder = 0;

    (node.content ?? []).forEach((child, idx) => {
      if (child.type !== EXERCISE_LINE_NODE_TYPE) {
        return;
      }

      const childPath = toNodePath(path, "content", idx);
      const lineMentions = parseExerciseLineNode(child, lookup, opts, childPath, runningSortOrder);

      exercises.push(...lineMentions);
      runningSortOrder += lineMentions.length;
    });

    if (exercises.length === 0 && opts.strict === true) {
      throw new BadRequestError("Scheme section must contain at least one exerciseMention", {
        code: "workout.section.empty",
        path,
      });
    }
  }

  return {
    kind: SchemeSectionKind.SCHEME,
    schemeId: attrs.schemeId ?? null,
    schemeKind: attrs.schemeKind ?? null,
    schemeConfig: attrs.schemeConfig ?? null,
    effortPct: attrs.effortPct ?? null,
    pace: attrs.pace ?? null,
    note: attrs.note ?? null,
    tone: null,
    sortOrder: attrs.sortOrder ?? sectionIndex,
    exercises,
    emomSlots,
  };
};

const parseNotesSectionNode = (
  node: TiptapNode,
  path: string,
  sectionIndex: number,
): SchemeSectionInput => {
  const parsed = notesSectionAttrsSchema.safeParse(node.attrs ?? {});

  if (!parsed.success) {
    throw new BadRequestError("Invalid notesSection attrs", {
      path,
      issues: parsed.error.issues,
    });
  }

  const attrs = parsed.data;

  return {
    kind: SchemeSectionKind.NOTES,
    schemeId: null,
    schemeKind: null,
    schemeConfig: null,
    effortPct: null,
    pace: null,
    note: attrs.note ?? null,
    tone: null,
    sortOrder: attrs.sortOrder ?? sectionIndex,
    exercises: [],
    emomSlots: [],
  };
};

const parseTextCalloutSectionNode = (
  node: TiptapNode,
  path: string,
  sectionIndex: number,
): SchemeSectionInput => {
  const parsed = textCalloutSectionAttrsSchema.safeParse(node.attrs ?? {});

  if (!parsed.success) {
    throw new BadRequestError("Invalid textCalloutSection attrs", {
      path,
      issues: parsed.error.issues,
    });
  }

  const attrs = parsed.data;

  return {
    kind: SchemeSectionKind.TEXT_CALLOUT,
    schemeId: null,
    schemeKind: null,
    schemeConfig: null,
    effortPct: null,
    pace: null,
    note: attrs.note ?? null,
    tone: attrs.tone ?? DEFAULT_TEXT_CALLOUT_TONE,
    sortOrder: attrs.sortOrder ?? sectionIndex,
    exercises: [],
    emomSlots: [],
  };
};

export const parseSectionNode = (
  node: TiptapNode,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
  path: string,
  sectionIndex: number,
): SchemeSectionInput => {
  if (node.type === SCHEME_SECTION_NODE_TYPE) {
    return parseSchemeSectionNode(node, lookup, opts, path, sectionIndex);
  }

  if (node.type === NOTES_SECTION_NODE_TYPE) {
    return parseNotesSectionNode(node, path, sectionIndex);
  }

  if (node.type === TEXT_CALLOUT_SECTION_NODE_TYPE) {
    return parseTextCalloutSectionNode(node, path, sectionIndex);
  }

  throw new BadRequestError("Unknown section node type", { path, nodeType: node.type });
};
