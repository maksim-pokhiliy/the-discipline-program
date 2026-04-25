import { Prisma } from "@prisma/client";

import { InternalServerError } from "@repo/errors";

import { type TxClient } from "../../../db/tx";
import { SCHEME_KIND_TO_PRISMA_MAP } from "../../../mappers/library";
import { WORKOUT_REP_SCHEME_TO_PRISMA_MAP } from "../../../mappers/lms";

import {
  type EmomSlotInput,
  type SchemeSectionInput,
  type WorkoutBlockExerciseInput,
  type WorkoutBlockInput,
  type WorkoutTreeInput,
} from "./parser-types";

const toPrismaPrescription = (
  prescription: WorkoutBlockExerciseInput["prescription"],
): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  prescription === null ? Prisma.JsonNull : (prescription as Prisma.InputJsonValue);

const toPrismaSchemeConfig = (
  schemeConfig: SchemeSectionInput["schemeConfig"],
): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  schemeConfig === null ? Prisma.JsonNull : (schemeConfig as Prisma.InputJsonValue);

const toBlockExerciseRow = (
  input: WorkoutBlockExerciseInput,
  parent: { sectionId: string | null; emomSlotId: string | null },
): Prisma.WorkoutBlockExerciseCreateManyInput => ({
  sectionId: parent.sectionId,
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
    data: blockInputs.map((block, blockIndex) => ({
      workoutId,
      blockTypeId: block.blockTypeId,
      title: block.title,
      sortOrder: block.sortOrder ?? blockIndex,
    })),
  });

  if (createdBlocks.length !== blockInputs.length) {
    throw new InternalServerError("persistWorkoutTree: block insertion count mismatch", {
      expected: blockInputs.length,
      actual: createdBlocks.length,
    });
  }

  type SectionRowSource = {
    input: SchemeSectionInput;
    blockIndex: number;
    sectionIndex: number;
  };

  const sectionRowSources: SectionRowSource[] = [];

  blockInputs.forEach((block, blockIndex) => {
    block.sections.forEach((section, sectionIndex) => {
      sectionRowSources.push({ input: section, blockIndex, sectionIndex });
    });
  });

  const createdSections =
    sectionRowSources.length > 0
      ? await tx.schemeSection.createManyAndReturn({
          data: sectionRowSources.map(({ input, blockIndex, sectionIndex }) => {
            const targetBlock = createdBlocks[blockIndex];

            if (!targetBlock) {
              throw new InternalServerError(
                "persistWorkoutTree: missing block for scheme section",
                { blockIndex, sectionIndex },
              );
            }

            return {
              blockId: targetBlock.id,
              kind: input.kind,
              schemeId: input.schemeId,
              schemeKind:
                input.schemeKind === null ? null : SCHEME_KIND_TO_PRISMA_MAP[input.schemeKind],
              schemeConfig: toPrismaSchemeConfig(input.schemeConfig),
              effortPct: input.effortPct,
              pace: input.pace,
              note: input.note,
              tone: input.tone,
              sortOrder: input.sortOrder,
            };
          }),
        })
      : [];

  if (createdSections.length !== sectionRowSources.length) {
    throw new InternalServerError("persistWorkoutTree: section insertion count mismatch", {
      expected: sectionRowSources.length,
      actual: createdSections.length,
    });
  }

  const sectionIdByPath = new Map<string, string>();

  sectionRowSources.forEach((source, idx) => {
    const targetSection = createdSections[idx];

    if (!targetSection) {
      throw new InternalServerError("persistWorkoutTree: missing created section row", {
        index: idx,
      });
    }

    sectionIdByPath.set(`${source.blockIndex}:${source.sectionIndex}`, targetSection.id);
  });

  type SlotRowSource = {
    input: EmomSlotInput;
    blockIndex: number;
    sectionIndex: number;
    slotIndex: number;
  };

  const slotRowSources: SlotRowSource[] = [];

  blockInputs.forEach((block, blockIndex) => {
    block.sections.forEach((section, sectionIndex) => {
      if (section.kind !== "SCHEME" || section.schemeKind !== "EMOM") {
        return;
      }

      section.emomSlots.forEach((slot, slotIndex) => {
        slotRowSources.push({ input: slot, blockIndex, sectionIndex, slotIndex });
      });
    });
  });

  const createdSlots =
    slotRowSources.length > 0
      ? await tx.emomSlot.createManyAndReturn({
          data: slotRowSources.map(({ input, blockIndex, sectionIndex }) => {
            const targetSectionId = sectionIdByPath.get(`${blockIndex}:${sectionIndex}`);

            if (!targetSectionId) {
              throw new InternalServerError("persistWorkoutTree: missing section for emom slot", {
                blockIndex,
                sectionIndex,
              });
            }

            return {
              sectionId: targetSectionId,
              minuteInRound: input.minuteInRound,
              sortOrder: input.sortOrder,
              note: input.note,
            };
          }),
        })
      : [];

  if (createdSlots.length !== slotRowSources.length) {
    throw new InternalServerError("persistWorkoutTree: emom slot insertion count mismatch", {
      expected: slotRowSources.length,
      actual: createdSlots.length,
    });
  }

  const slotIdByPath = new Map<string, string>();

  slotRowSources.forEach((source, idx) => {
    const targetSlot = createdSlots[idx];

    if (!targetSlot) {
      throw new InternalServerError("persistWorkoutTree: missing created emom slot row", {
        index: idx,
      });
    }

    slotIdByPath.set(
      `${source.blockIndex}:${source.sectionIndex}:${source.slotIndex}`,
      targetSlot.id,
    );
  });

  const exerciseRows: Prisma.WorkoutBlockExerciseCreateManyInput[] = [];

  blockInputs.forEach((block, blockIndex) => {
    block.sections.forEach((section, sectionIndex) => {
      const sectionId = sectionIdByPath.get(`${blockIndex}:${sectionIndex}`);

      if (!sectionId) {
        throw new InternalServerError(
          "persistWorkoutTree: missing section id when building exercise rows",
          { blockIndex, sectionIndex },
        );
      }

      if (section.kind === "SCHEME" && section.schemeKind === "EMOM") {
        section.emomSlots.forEach((slot, slotIndex) => {
          const slotId = slotIdByPath.get(`${blockIndex}:${sectionIndex}:${slotIndex}`);

          if (!slotId) {
            throw new InternalServerError(
              "persistWorkoutTree: missing slot id when building exercise rows",
              { blockIndex, sectionIndex, slotIndex },
            );
          }

          slot.exercises.forEach((exercise) => {
            exerciseRows.push(
              toBlockExerciseRow(exercise, { sectionId: null, emomSlotId: slotId }),
            );
          });
        });

        return;
      }

      section.exercises.forEach((exercise) => {
        exerciseRows.push(toBlockExerciseRow(exercise, { sectionId, emomSlotId: null }));
      });
    });
  });

  if (exerciseRows.length > 0) {
    await tx.workoutBlockExercise.createMany({ data: exerciseRows });
  }
};
