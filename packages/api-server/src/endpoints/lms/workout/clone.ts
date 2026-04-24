import { Prisma } from "@prisma/client";

import { type TiptapDoc, type TiptapNode } from "@repo/contracts/common/tiptap-doc";
import { InternalServerError } from "@repo/errors";

import { type TxClient } from "../../../db/tx";

export type CloneWorkoutTreeResult = {
  blockIdMap: Map<string, string>;
  slotIdMap: Map<string, string>;
};

export const cloneWorkoutTree = async (params: {
  sourceWorkoutId: string;
  targetWorkoutId: string;
  tx: TxClient;
}): Promise<CloneWorkoutTreeResult> => {
  const { sourceWorkoutId, targetWorkoutId, tx } = params;

  const blockIdMap = new Map<string, string>();
  const slotIdMap = new Map<string, string>();

  const sourceBlocks = await tx.workoutBlock.findMany({
    where: { workoutId: sourceWorkoutId },
    orderBy: { sortOrder: "asc" },
    include: {
      exercises: { orderBy: { sortOrder: "asc" } },
      emomSlots: {
        orderBy: { sortOrder: "asc" },
        include: { exercises: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (sourceBlocks.length === 0) {
    return { blockIdMap, slotIdMap };
  }

  const createdBlocks = await tx.workoutBlock.createManyAndReturn({
    data: sourceBlocks.map((block) => ({
      workoutId: targetWorkoutId,
      blockTypeId: block.blockTypeId,
      schemeId: block.schemeId,
      schemeKind: block.schemeKind,
      schemeConfig:
        block.schemeConfig === null
          ? Prisma.JsonNull
          : (block.schemeConfig as Prisma.InputJsonValue),
      effortPct: block.effortPct,
      pace: block.pace,
      note: block.note,
      sortOrder: block.sortOrder,
    })),
  });

  sourceBlocks.forEach((src, index) => {
    const target = createdBlocks[index];

    if (!target) {
      return;
    }

    blockIdMap.set(src.id, target.id);
  });

  const sourceSlots = sourceBlocks.flatMap((block) => block.emomSlots);

  if (sourceSlots.length > 0) {
    const createdSlots = await tx.emomSlot.createManyAndReturn({
      data: sourceSlots.map((slot) => {
        const targetBlockId = blockIdMap.get(slot.blockId);

        if (!targetBlockId) {
          throw new InternalServerError("cloneWorkoutTree: missing target block id for emom slot", {
            sourceSlotId: slot.id,
            sourceBlockId: slot.blockId,
          });
        }

        return {
          blockId: targetBlockId,
          minuteInRound: slot.minuteInRound,
          sortOrder: slot.sortOrder,
          note: slot.note,
        };
      }),
    });

    sourceSlots.forEach((src, index) => {
      const target = createdSlots[index];

      if (!target) {
        return;
      }

      slotIdMap.set(src.id, target.id);
    });
  }

  const blockExerciseRows: Prisma.WorkoutBlockExerciseCreateManyInput[] = sourceBlocks.flatMap(
    (block) => {
      const targetBlockId = blockIdMap.get(block.id);

      if (!targetBlockId) {
        return [];
      }

      return block.exercises.map((exercise) => ({
        blockId: targetBlockId,
        emomSlotId: null,
        exerciseId: exercise.exerciseId,
        repScheme: exercise.repScheme,
        repValues: exercise.repValues,
        sets: exercise.sets,
        prescription:
          exercise.prescription === null
            ? Prisma.JsonNull
            : (exercise.prescription as Prisma.InputJsonValue),
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
        blockId: null,
        emomSlotId: targetSlotId,
        exerciseId: exercise.exerciseId,
        repScheme: exercise.repScheme,
        repValues: exercise.repValues,
        sets: exercise.sets,
        prescription:
          exercise.prescription === null
            ? Prisma.JsonNull
            : (exercise.prescription as Prisma.InputJsonValue),
        restSec: exercise.restSec,
        note: exercise.note,
        complexGroup: exercise.complexGroup,
        complexOrder: exercise.complexOrder,
        sortOrder: exercise.sortOrder,
      }));
    },
  );

  const allExercises = [...blockExerciseRows, ...slotExerciseRows];

  if (allExercises.length > 0) {
    await tx.workoutBlockExercise.createMany({ data: allExercises });
  }

  return { blockIdMap, slotIdMap };
};

const REMAPPABLE_ATTR_KEYS = ["blockId", "emomSlotId"] as const;

const remapNode = (
  node: TiptapNode,
  blockIdMap: Map<string, string>,
  slotIdMap: Map<string, string>,
): TiptapNode => {
  const nextAttrs: Record<string, unknown> | undefined = node.attrs ? { ...node.attrs } : undefined;

  if (nextAttrs) {
    for (const key of REMAPPABLE_ATTR_KEYS) {
      const value = nextAttrs[key];

      if (typeof value !== "string") {
        continue;
      }

      const source = key === "blockId" ? blockIdMap : slotIdMap;
      const mapped = source.get(value);

      if (mapped) {
        nextAttrs[key] = mapped;
      }
    }
  }

  const nextContent = node.content
    ? node.content.map((child) => remapNode(child, blockIdMap, slotIdMap))
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
  slotIdMap: Map<string, string>,
): TiptapDoc => ({
  type: doc.type,
  content: doc.content.map((node) => remapNode(node, blockIdMap, slotIdMap)),
});
