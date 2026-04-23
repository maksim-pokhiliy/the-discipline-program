import { Prisma } from "@prisma/client";

import { type TxClient } from "../../../db/tx";
import { SCHEME_KIND_TO_PRISMA_MAP } from "../../../mappers/library";
import { WORKOUT_REP_SCHEME_TO_PRISMA_MAP } from "../../../mappers/lms";

import {
  type EmomSlotInput,
  type WorkoutBlockExerciseInput,
  type WorkoutBlockInput,
  type WorkoutTreeInput,
} from "./parser-types";

const toPrismaPrescription = (
  prescription: WorkoutBlockExerciseInput["prescription"],
): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  prescription === null ? Prisma.JsonNull : (prescription as Prisma.InputJsonValue);

const toPrismaSchemeConfig = (
  schemeConfig: WorkoutBlockInput["schemeConfig"],
): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  schemeConfig === null ? Prisma.JsonNull : (schemeConfig as Prisma.InputJsonValue);

const toBlockExerciseRow = (
  input: WorkoutBlockExerciseInput,
  parent: { blockId: string | null; emomSlotId: string | null },
): Prisma.WorkoutBlockExerciseCreateManyInput => ({
  blockId: parent.blockId,
  emomSlotId: parent.emomSlotId,
  exerciseId: input.exerciseId,
  repScheme: WORKOUT_REP_SCHEME_TO_PRISMA_MAP[input.repScheme],
  repValues: input.repValues,
  sets: input.sets,
  prescription: toPrismaPrescription(input.prescription),
  restSec: input.restSec,
  note: input.note,
  complexGroup: input.complexGroup,
  complexOrder: input.complexOrder,
  sortOrder: input.sortOrder,
});

export const persistWorkoutTree = async (params: {
  workoutId: string;
  tree: WorkoutTreeInput;
  tx: TxClient;
}): Promise<void> => {
  const { workoutId, tree, tx } = params;

  await tx.workoutBlock.deleteMany({ where: { workoutId } });

  if (tree.blocks.length === 0) {
    return;
  }

  const blockInputs: WorkoutBlockInput[] = tree.blocks;

  const createdBlocks = await tx.workoutBlock.createManyAndReturn({
    data: blockInputs.map((block) => ({
      workoutId,
      blockTypeId: block.blockTypeId,
      schemeId: block.schemeId,
      schemeKind: block.schemeKind === null ? null : SCHEME_KIND_TO_PRISMA_MAP[block.schemeKind],
      schemeConfig: toPrismaSchemeConfig(block.schemeConfig),
      effortPct: block.effortPct,
      pace: block.pace,
      note: block.note,
      sortOrder: block.sortOrder,
    })),
  });

  const slotCreateRows: {
    input: EmomSlotInput;
    blockIndex: number;
  }[] = [];

  blockInputs.forEach((block, blockIndex) => {
    block.emomSlots.forEach((slot) => {
      slotCreateRows.push({ input: slot, blockIndex });
    });
  });

  const createdSlots =
    slotCreateRows.length > 0
      ? await tx.emomSlot.createManyAndReturn({
          data: slotCreateRows.map(({ input, blockIndex }) => {
            const targetBlock = createdBlocks[blockIndex];

            if (!targetBlock) {
              throw new Error("persistWorkoutTree: missing block for emom slot");
            }

            return {
              blockId: targetBlock.id,
              minuteInRound: input.minuteInRound,
              sortOrder: input.sortOrder,
              note: input.note,
            };
          }),
        })
      : [];

  const exerciseRows: Prisma.WorkoutBlockExerciseCreateManyInput[] = [];

  blockInputs.forEach((block, blockIndex) => {
    const targetBlock = createdBlocks[blockIndex];

    if (!targetBlock) {
      return;
    }

    block.exercises.forEach((exercise) => {
      exerciseRows.push(
        toBlockExerciseRow(exercise, { blockId: targetBlock.id, emomSlotId: null }),
      );
    });
  });

  let slotCursor = 0;

  blockInputs.forEach((block) => {
    block.emomSlots.forEach((slot) => {
      const targetSlot = createdSlots[slotCursor];

      slotCursor += 1;

      if (!targetSlot) {
        return;
      }

      slot.exercises.forEach((exercise) => {
        exerciseRows.push(
          toBlockExerciseRow(exercise, { blockId: null, emomSlotId: targetSlot.id }),
        );
      });
    });
  });

  if (exerciseRows.length > 0) {
    await tx.workoutBlockExercise.createMany({ data: exerciseRows });
  }
};
