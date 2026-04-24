import {
  BLOCK_NODE_TYPES,
  type TiptapDoc,
  type TiptapNode,
} from "@repo/contracts/common/tiptap-doc";
import {
  type SchemeConfig,
  schemeConfigSchema,
  WORKOUT_DOC_LIMITS,
  WorkoutRepScheme,
} from "@repo/contracts/lms/workout-block";
import { BadRequestError } from "@repo/errors";

import {
  BLOCK_KIND_TO_SCHEME_KIND,
  blockAttrsSchema,
  EMOM_NODE_TYPE,
  EMOM_SLOT_NODE_TYPE,
  emomSlotAttrsSchema,
  EXERCISE_MENTION_NODE_TYPE,
  exerciseMentionAttrsSchema,
  SCHEMELESS_BLOCK_NODE_TYPES,
  schemelessBlockAttrsSchema,
  toNodePath,
} from "./parser-schemas";
import {
  type EmomSlotInput,
  type LibraryLookup,
  type ParseWorkoutDocOptions,
  type WorkoutBlockExerciseInput,
  type WorkoutBlockInput,
  type WorkoutTreeInput,
} from "./parser-types";

export type {
  EmomSlotInput,
  LibraryLookup,
  LibraryLookupEntry,
  ParseWorkoutDocOptions,
  WorkoutBlockExerciseInput,
  WorkoutBlockInput,
  WorkoutTreeInput,
} from "./parser-types";

const assertKnownBlockType = (type: string, path: string): void => {
  if (!(BLOCK_NODE_TYPES as readonly string[]).includes(type)) {
    throw new BadRequestError("Unknown block node type", { path, nodeType: type });
  }
};

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

const collectExerciseMentions = (
  content: TiptapNode[] | undefined,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
  pathPrefix: string,
): WorkoutBlockExerciseInput[] => {
  if (!content) {
    return [];
  }

  const result: WorkoutBlockExerciseInput[] = [];
  let sortOrder = 0;

  const walk = (nodes: TiptapNode[], path: string): void => {
    nodes.forEach((child, idx) => {
      const childPath = toNodePath(path, "content", idx);

      if (child.type === EXERCISE_MENTION_NODE_TYPE) {
        result.push(parseExerciseMention(child, lookup, opts, childPath, sortOrder));
        sortOrder += 1;

        return;
      }

      if (child.content) {
        walk(child.content, childPath);
      }
    });
  };

  walk(content, pathPrefix);

  return result;
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

  const exercises = collectExerciseMentions(node.content, lookup, opts, path);

  if (exercises.length === 0) {
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

const parseSchemeConfig = (value: unknown, path: string): SchemeConfig | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = schemeConfigSchema.safeParse(value);

  if (!parsed.success) {
    throw new BadRequestError("Invalid schemeConfig shape", { path, issues: parsed.error.issues });
  }

  return parsed.data;
};

const parseSchemelessBlock = (
  node: TiptapNode,
  lookup: LibraryLookup,
  path: string,
  sortOrder: number,
): WorkoutBlockInput => {
  const parsed = schemelessBlockAttrsSchema.safeParse(node.attrs ?? {});

  if (!parsed.success) {
    throw new BadRequestError("Invalid block attrs", {
      path,
      nodeType: node.type,
      issues: parsed.error.issues,
    });
  }

  if (!lookup.blockTypeIds.has(parsed.data.blockTypeId)) {
    throw new BadRequestError("Referenced blockTypeId not found in library", {
      path,
      blockTypeId: parsed.data.blockTypeId,
    });
  }

  return {
    blockTypeId: parsed.data.blockTypeId,
    schemeId: null,
    schemeKind: null,
    schemeConfig: null,
    effortPct: null,
    pace: null,
    note: parsed.data.note ?? null,
    sortOrder,
    exercises: [],
    emomSlots: [],
  };
};

const parseBlockNode = (
  node: TiptapNode,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
  path: string,
  sortOrder: number,
): WorkoutBlockInput => {
  assertKnownBlockType(node.type, path);

  if (SCHEMELESS_BLOCK_NODE_TYPES.has(node.type)) {
    return parseSchemelessBlock(node, lookup, path, sortOrder);
  }

  const parsed = blockAttrsSchema.safeParse(node.attrs ?? {});

  if (!parsed.success) {
    throw new BadRequestError("Invalid block attrs", {
      path,
      nodeType: node.type,
      issues: parsed.error.issues,
    });
  }

  const attrs = parsed.data;

  if (!lookup.blockTypeIds.has(attrs.blockTypeId)) {
    throw new BadRequestError("Referenced blockTypeId not found in library", {
      path,
      blockTypeId: attrs.blockTypeId,
    });
  }

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

  const emomSlots: EmomSlotInput[] = [];
  const exercises: WorkoutBlockExerciseInput[] = [];

  if (node.type === EMOM_NODE_TYPE) {
    (node.content ?? []).forEach((child, idx) => {
      const childPath = toNodePath(path, "content", idx);

      if (child.type !== EMOM_SLOT_NODE_TYPE) {
        throw new BadRequestError("Expected emomSlot child inside emom block", {
          path: childPath,
          nodeType: child.type,
        });
      }

      emomSlots.push(parseEmomSlotNode(child, lookup, opts, childPath, idx));
    });

    if (emomSlots.length === 0) {
      throw new BadRequestError("emom block must contain at least one emomSlot", {
        code: "workout.emom.empty",
        path,
      });
    }
  } else {
    const blockExercises = collectExerciseMentions(node.content, lookup, opts, path);

    if (blockExercises.length === 0) {
      throw new BadRequestError("Scheme block must contain at least one exerciseMention", {
        code: "workout.block.empty",
        path,
        nodeType: node.type,
      });
    }

    exercises.push(...blockExercises);
  }

  return {
    blockTypeId: attrs.blockTypeId,
    schemeId: attrs.schemeId ?? null,
    schemeKind: BLOCK_KIND_TO_SCHEME_KIND[node.type] ?? null,
    schemeConfig: parseSchemeConfig(attrs.schemeConfig, path),
    effortPct: attrs.effortPct ?? null,
    pace: attrs.pace ?? null,
    note: attrs.note ?? null,
    sortOrder,
    exercises,
    emomSlots,
  };
};

export const parseTiptapDoc = (
  doc: TiptapDoc,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
): WorkoutTreeInput => {
  const serialized = JSON.stringify(doc);

  if (serialized.length > WORKOUT_DOC_LIMITS.MAX_DOC_BYTES) {
    throw new BadRequestError("Workout doc exceeds maximum byte size", {
      code: "workout.doc.too_large",
      limit: WORKOUT_DOC_LIMITS.MAX_DOC_BYTES,
      actual: serialized.length,
    });
  }

  let nodeCount = 0;

  const countNodes = (node: TiptapNode): void => {
    nodeCount += 1;

    if (nodeCount > WORKOUT_DOC_LIMITS.MAX_NODES_PER_DOC) {
      throw new BadRequestError("Workout doc exceeds maximum node count", {
        code: "workout.doc.too_many_nodes",
        limit: WORKOUT_DOC_LIMITS.MAX_NODES_PER_DOC,
        actual: nodeCount,
      });
    }

    node.content?.forEach(countNodes);
  };

  doc.content.forEach(countNodes);

  const blocks: WorkoutBlockInput[] = doc.content.map((node, idx) =>
    parseBlockNode(node, lookup, opts, toNodePath("content", idx), idx),
  );

  return { blocks };
};
