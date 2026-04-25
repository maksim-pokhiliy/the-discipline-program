import {
  type BlockType,
  type EmomSlot,
  type Exercise,
  type Prisma,
  PrismaClient,
  type Scheme,
  type SchemeKind,
  type SchemeSection,
  type Workout,
  type WorkoutBlock,
  type WorkoutBlockExercise,
} from "@prisma/client";

import { createTestWorkout } from "./helpers";

const rawPrisma = new PrismaClient();

export const createTestExercise = async (
  createdByUserId: string,
  overrides: Partial<Prisma.ExerciseUncheckedCreateInput> = {},
): Promise<Exercise> => {
  const id = crypto.randomUUID();
  const canonicalName = `Test Exercise ${id.slice(0, 8)}`;
  const normalizedName = canonicalName.toLowerCase().trim().replace(/\s+/g, " ");

  return rawPrisma.exercise.create({
    data: {
      canonicalName,
      normalizedName,
      aliases: [],
      measurementUnits: ["REPS"],
      hasLoad: false,
      status: "APPROVED",
      createdByUserId,
      ...overrides,
    },
  });
};

export const createTestScheme = async (
  overrides: Partial<Prisma.SchemeUncheckedCreateInput> = {},
): Promise<Scheme> => {
  const id = crypto.randomUUID();

  return rawPrisma.scheme.create({
    data: {
      slug: `test-scheme-${id.slice(0, 8)}`,
      name: `Test Scheme ${id.slice(0, 8)}`,
      kind: "STRAIGHT_SETS",
      requiredParams: [],
      paramDefaults: {},
      ...overrides,
    },
  });
};

export const createTestBlockType = async (
  overrides: Partial<Prisma.BlockTypeUncheckedCreateInput> = {},
): Promise<BlockType> => {
  const id = crypto.randomUUID();

  return rawPrisma.blockType.create({
    data: {
      slug: `test-block-type-${id.slice(0, 8)}`,
      name: `Test BlockType ${id.slice(0, 8)}`,
      ...overrides,
    },
  });
};

export type ExerciseRowSpec = {
  exerciseId: string;
  repScheme?: Prisma.WorkoutBlockExerciseUncheckedCreateInput["repScheme"];
  repValues?: number[];
  sets?: number | null;
  sortOrder?: number;
  prescription?: Prisma.InputJsonValue | null;
  restSec?: number | null;
  note?: string | null;
  complexGroup?: string | null;
  complexOrder?: number | null;
};

export type EmomSlotSpec = {
  minuteInRound: number;
  sortOrder?: number;
  note?: string | null;
  exercises?: ExerciseRowSpec[];
};

export type SectionSpec = {
  kind?: "SCHEME" | "NOTES" | "TEXT_CALLOUT";
  schemeId?: string | null;
  schemeKind?: SchemeKind | null;
  schemeConfig?: Prisma.InputJsonValue | null;
  effortPct?: number | null;
  pace?: string | null;
  note?: string | null;
  tone?: string | null;
  sortOrder?: number;
  exercises?: ExerciseRowSpec[];
  emomSlots?: EmomSlotSpec[];
};

export type BlockSpec = {
  blockTypeId: string;
  title?: string | null;
  sortOrder?: number;
  sections: SectionSpec[];
};

export type CreatedSection = SchemeSection & {
  exercises: WorkoutBlockExercise[];
  emomSlots: (EmomSlot & { exercises: WorkoutBlockExercise[] })[];
};

export type CreatedBlock = WorkoutBlock & {
  sections: CreatedSection[];
};

export type TestWorkoutWithBlocks = {
  workout: Workout;
  blocks: CreatedBlock[];
  toCleanup: { table: string; id: string }[];
};

const toExerciseCreateInput = (
  spec: ExerciseRowSpec,
  parent: { sectionId: string | null; emomSlotId: string | null },
  fallbackSortOrder: number,
): Prisma.WorkoutBlockExerciseUncheckedCreateInput => {
  const data: Prisma.WorkoutBlockExerciseUncheckedCreateInput = {
    sectionId: parent.sectionId,
    emomSlotId: parent.emomSlotId,
    exerciseId: spec.exerciseId,
    repScheme: spec.repScheme ?? "STRAIGHT",
    repValues: spec.repValues ?? [],
    sortOrder: spec.sortOrder ?? fallbackSortOrder,
  };

  if (spec.sets !== undefined) {
    data.sets = spec.sets;
  }

  if (spec.prescription !== undefined && spec.prescription !== null) {
    data.prescription = spec.prescription;
  }

  if (spec.restSec !== undefined) {
    data.restSec = spec.restSec;
  }

  if (spec.note !== undefined) {
    data.note = spec.note;
  }

  if (spec.complexGroup !== undefined) {
    data.complexGroup = spec.complexGroup;
  }

  if (spec.complexOrder !== undefined) {
    data.complexOrder = spec.complexOrder;
  }

  return data;
};

export const createTestWorkoutWithBlocks = async (params: {
  planId: string;
  blocks: BlockSpec[];
  scheduledDate?: Date;
  workoutOverrides?: Partial<Prisma.WorkoutUncheckedCreateInput>;
}): Promise<TestWorkoutWithBlocks> => {
  const { planId, blocks: blockSpecs, scheduledDate, workoutOverrides = {} } = params;

  const toCleanup: { table: string; id: string }[] = [];

  const workout = await createTestWorkout(planId, {
    ...(scheduledDate !== undefined ? { scheduledDate } : {}),
    ...workoutOverrides,
  });

  toCleanup.push({ table: "workout", id: workout.id });

  const blocks: CreatedBlock[] = [];

  for (let blockIndex = 0; blockIndex < blockSpecs.length; blockIndex += 1) {
    const blockSpec = blockSpecs[blockIndex];

    if (!blockSpec) {
      continue;
    }

    const block = await rawPrisma.workoutBlock.create({
      data: {
        workoutId: workout.id,
        blockTypeId: blockSpec.blockTypeId,
        title: blockSpec.title ?? null,
        sortOrder: blockSpec.sortOrder ?? blockIndex,
      },
    });

    toCleanup.push({ table: "workoutBlock", id: block.id });

    const sections: CreatedSection[] = [];

    for (let sectionIndex = 0; sectionIndex < blockSpec.sections.length; sectionIndex += 1) {
      const sectionSpec = blockSpec.sections[sectionIndex];

      if (!sectionSpec) {
        continue;
      }

      const section = await rawPrisma.schemeSection.create({
        data: {
          blockId: block.id,
          kind: sectionSpec.kind ?? "SCHEME",
          schemeId: sectionSpec.schemeId ?? null,
          schemeKind: sectionSpec.schemeKind ?? null,
          schemeConfig:
            sectionSpec.schemeConfig === undefined || sectionSpec.schemeConfig === null
              ? undefined
              : sectionSpec.schemeConfig,
          effortPct: sectionSpec.effortPct ?? null,
          pace: sectionSpec.pace ?? null,
          note: sectionSpec.note ?? null,
          tone: sectionSpec.tone ?? null,
          sortOrder: sectionSpec.sortOrder ?? sectionIndex,
        },
      });

      toCleanup.push({ table: "schemeSection", id: section.id });

      const sectionExercises: WorkoutBlockExercise[] = [];

      if (sectionSpec.exercises) {
        for (let i = 0; i < sectionSpec.exercises.length; i += 1) {
          const exerciseSpec = sectionSpec.exercises[i];

          if (!exerciseSpec) {
            continue;
          }

          const exercise = await rawPrisma.workoutBlockExercise.create({
            data: toExerciseCreateInput(
              exerciseSpec,
              { sectionId: section.id, emomSlotId: null },
              i,
            ),
          });

          toCleanup.push({ table: "workoutBlockExercise", id: exercise.id });
          sectionExercises.push(exercise);
        }
      }

      const slots: (EmomSlot & { exercises: WorkoutBlockExercise[] })[] = [];

      if (sectionSpec.emomSlots) {
        for (let slotIndex = 0; slotIndex < sectionSpec.emomSlots.length; slotIndex += 1) {
          const slotSpec = sectionSpec.emomSlots[slotIndex];

          if (!slotSpec) {
            continue;
          }

          const slot = await rawPrisma.emomSlot.create({
            data: {
              sectionId: section.id,
              minuteInRound: slotSpec.minuteInRound,
              sortOrder: slotSpec.sortOrder ?? slotIndex,
              note: slotSpec.note ?? null,
            },
          });

          toCleanup.push({ table: "emomSlot", id: slot.id });

          const slotExercises: WorkoutBlockExercise[] = [];

          if (slotSpec.exercises) {
            for (let i = 0; i < slotSpec.exercises.length; i += 1) {
              const exerciseSpec = slotSpec.exercises[i];

              if (!exerciseSpec) {
                continue;
              }

              const exercise = await rawPrisma.workoutBlockExercise.create({
                data: toExerciseCreateInput(
                  exerciseSpec,
                  { sectionId: null, emomSlotId: slot.id },
                  i,
                ),
              });

              toCleanup.push({ table: "workoutBlockExercise", id: exercise.id });
              slotExercises.push(exercise);
            }
          }

          slots.push({ ...slot, exercises: slotExercises });
        }
      }

      sections.push({ ...section, exercises: sectionExercises, emomSlots: slots });
    }

    blocks.push({ ...block, sections });
  }

  return { workout, blocks, toCleanup };
};
