import { Prisma } from "@prisma/client";

import { type TiptapDoc, type TiptapNode } from "@repo/contracts/common/tiptap-doc";
import { InternalServerError } from "@repo/errors";

import { type TxClient } from "../../../db/tx";

export type CloneWorkoutTreeResult = {
  blockIdMap: Map<string, string>;
  sectionIdMap: Map<string, string>;
  slotIdMap: Map<string, string>;
};

const toInputJson = (value: Prisma.JsonValue): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

export const cloneWorkoutTree = async (params: {
  sourceWorkoutId: string;
  targetWorkoutId: string;
  tx: TxClient;
}): Promise<CloneWorkoutTreeResult> => {
  const { sourceWorkoutId, targetWorkoutId, tx } = params;

  const blockIdMap = new Map<string, string>();
  const sectionIdMap = new Map<string, string>();
  const slotIdMap = new Map<string, string>();

  const sourceBlocks = await tx.workoutBlock.findMany({
    where: { workoutId: sourceWorkoutId },
    orderBy: { sortOrder: "asc" },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          exercises: { orderBy: { sortOrder: "asc" } },
          emomSlots: {
            orderBy: { sortOrder: "asc" },
            include: { exercises: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });

  if (sourceBlocks.length === 0) {
    return { blockIdMap, sectionIdMap, slotIdMap };
  }

  const createdBlocks = await tx.workoutBlock.createManyAndReturn({
    data: sourceBlocks.map((block) => ({
      workoutId: targetWorkoutId,
      blockTypeId: block.blockTypeId,
      title: block.title,
      sortOrder: block.sortOrder,
    })),
  });

  if (createdBlocks.length !== sourceBlocks.length) {
    throw new InternalServerError("cloneWorkoutTree: block insertion count mismatch", {
      expected: sourceBlocks.length,
      actual: createdBlocks.length,
    });
  }

  sourceBlocks.forEach((src, index) => {
    const target = createdBlocks[index];

    if (!target) {
      throw new InternalServerError("cloneWorkoutTree: missing created block row", { index });
    }

    blockIdMap.set(src.id, target.id);
  });

  const sourceSections = sourceBlocks.flatMap((block) => block.sections);

  const createdSections =
    sourceSections.length > 0
      ? await tx.schemeSection.createManyAndReturn({
          data: sourceSections.map((section) => {
            const targetBlockId = blockIdMap.get(section.blockId);

            if (!targetBlockId) {
              throw new InternalServerError(
                "cloneWorkoutTree: missing target block id for scheme section",
                { sourceSectionId: section.id, sourceBlockId: section.blockId },
              );
            }

            return {
              blockId: targetBlockId,
              kind: section.kind,
              schemeId: section.schemeId,
              schemeKind: section.schemeKind,
              schemeConfig: toInputJson(section.schemeConfig),
              effortPct: section.effortPct,
              pace: section.pace,
              note: section.note,
              tone: section.tone,
              sortOrder: section.sortOrder,
            };
          }),
        })
      : [];

  if (createdSections.length !== sourceSections.length) {
    throw new InternalServerError("cloneWorkoutTree: section insertion count mismatch", {
      expected: sourceSections.length,
      actual: createdSections.length,
    });
  }

  sourceSections.forEach((src, index) => {
    const target = createdSections[index];

    if (!target) {
      throw new InternalServerError("cloneWorkoutTree: missing created section row", { index });
    }

    sectionIdMap.set(src.id, target.id);
  });

  const sourceSlots = sourceSections.flatMap((section) => section.emomSlots);

  const createdSlots =
    sourceSlots.length > 0
      ? await tx.emomSlot.createManyAndReturn({
          data: sourceSlots.map((slot) => {
            const targetSectionId = sectionIdMap.get(slot.sectionId);

            if (!targetSectionId) {
              throw new InternalServerError(
                "cloneWorkoutTree: missing target section id for emom slot",
                { sourceSlotId: slot.id, sourceSectionId: slot.sectionId },
              );
            }

            return {
              sectionId: targetSectionId,
              minuteInRound: slot.minuteInRound,
              sortOrder: slot.sortOrder,
              note: slot.note,
            };
          }),
        })
      : [];

  if (createdSlots.length !== sourceSlots.length) {
    throw new InternalServerError("cloneWorkoutTree: emom slot insertion count mismatch", {
      expected: sourceSlots.length,
      actual: createdSlots.length,
    });
  }

  sourceSlots.forEach((src, index) => {
    const target = createdSlots[index];

    if (!target) {
      throw new InternalServerError("cloneWorkoutTree: missing created emom slot row", { index });
    }

    slotIdMap.set(src.id, target.id);
  });

  const sectionExerciseRows: Prisma.WorkoutBlockExerciseCreateManyInput[] = sourceSections.flatMap(
    (section) => {
      const targetSectionId = sectionIdMap.get(section.id);

      if (!targetSectionId) {
        return [];
      }

      return section.exercises.map((exercise) => ({
        sectionId: targetSectionId,
        emomSlotId: null,
        exerciseId: exercise.exerciseId,
        repScheme: exercise.repScheme,
        repValues: exercise.repValues,
        sets: exercise.sets,
        prescription: toInputJson(exercise.prescription),
        restSec: exercise.restSec,
        note: exercise.note,
        complexGroup: exercise.complexGroup,
        complexOrder: exercise.complexOrder,
        sortOrder: exercise.sortOrder,
      }));
    },
  );

  const slotExerciseRows: Prisma.WorkoutBlockExerciseCreateManyInput[] = sourceSlots.flatMap(
    (slot) => {
      const targetSlotId = slotIdMap.get(slot.id);

      if (!targetSlotId) {
        return [];
      }

      return slot.exercises.map((exercise) => ({
        sectionId: null,
        emomSlotId: targetSlotId,
        exerciseId: exercise.exerciseId,
        repScheme: exercise.repScheme,
        repValues: exercise.repValues,
        sets: exercise.sets,
        prescription: toInputJson(exercise.prescription),
        restSec: exercise.restSec,
        note: exercise.note,
        complexGroup: exercise.complexGroup,
        complexOrder: exercise.complexOrder,
        sortOrder: exercise.sortOrder,
      }));
    },
  );

  const allExercises = [...sectionExerciseRows, ...slotExerciseRows];

  if (allExercises.length > 0) {
    await tx.workoutBlockExercise.createMany({ data: allExercises });
  }

  return { blockIdMap, sectionIdMap, slotIdMap };
};

const REMAPPABLE_ATTR_KEYS = ["blockId", "sectionId", "emomSlotId"] as const;

type RemappableAttrKey = (typeof REMAPPABLE_ATTR_KEYS)[number];

const resolveMap = (
  key: RemappableAttrKey,
  blockIdMap: Map<string, string>,
  sectionIdMap: Map<string, string>,
  slotIdMap: Map<string, string>,
): Map<string, string> => {
  if (key === "blockId") {
    return blockIdMap;
  }

  if (key === "sectionId") {
    return sectionIdMap;
  }

  return slotIdMap;
};

const remapNode = (
  node: TiptapNode,
  blockIdMap: Map<string, string>,
  sectionIdMap: Map<string, string>,
  slotIdMap: Map<string, string>,
): TiptapNode => {
  const nextAttrs: Record<string, unknown> | undefined = node.attrs ? { ...node.attrs } : undefined;

  if (nextAttrs) {
    for (const key of REMAPPABLE_ATTR_KEYS) {
      const value = nextAttrs[key];

      if (typeof value !== "string") {
        continue;
      }

      const source = resolveMap(key, blockIdMap, sectionIdMap, slotIdMap);
      const mapped = source.get(value);

      if (mapped) {
        nextAttrs[key] = mapped;
      }
    }
  }

  const nextContent = node.content
    ? node.content.map((child) => remapNode(child, blockIdMap, sectionIdMap, slotIdMap))
    : undefined;

  return {
    type: node.type,
    ...(nextAttrs ? { attrs: nextAttrs } : {}),
    ...(nextContent ? { content: nextContent } : {}),
    ...(node.text !== undefined ? { text: node.text } : {}),
    ...(node.marks ? { marks: node.marks.map((mark) => ({ ...mark })) } : {}),
  };
};

export const remapMentionNodeIds = (
  doc: TiptapDoc,
  blockIdMap: Map<string, string>,
  sectionIdMap: Map<string, string>,
  slotIdMap: Map<string, string>,
): TiptapDoc => ({
  type: doc.type,
  content: doc.content.map((node) => remapNode(node, blockIdMap, sectionIdMap, slotIdMap)),
});
