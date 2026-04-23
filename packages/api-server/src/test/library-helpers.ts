import {
  type BlockType,
  type EmomSlot,
  type Exercise,
  type Prisma,
  PrismaClient,
  type Scheme,
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

export type TestWorkoutWithBlocks = {
  workout: Workout;
  blocks: (WorkoutBlock & {
    exercises: WorkoutBlockExercise[];
    emomSlots: (EmomSlot & { exercises: WorkoutBlockExercise[] })[];
  })[];
  toCleanup: { table: string; id: string }[];
};

export const createTestWorkoutWithBlocks = async (params: {
  planId: string;
  blockTypeId: string;
  schemeId?: string | null;
  exerciseIds: string[];
  scheduledDate?: Date;
  blockCount?: number;
  exercisesPerBlock?: number;
  workoutOverrides?: Partial<Prisma.WorkoutUncheckedCreateInput>;
}): Promise<TestWorkoutWithBlocks> => {
  const {
    planId,
    blockTypeId,
    schemeId = null,
    exerciseIds,
    scheduledDate,
    blockCount = 1,
    exercisesPerBlock = 1,
    workoutOverrides = {},
  } = params;

  if (exerciseIds.length === 0) {
    throw new Error("createTestWorkoutWithBlocks: exerciseIds must be non-empty");
  }

  const toCleanup: { table: string; id: string }[] = [];

  const workout = await createTestWorkout(planId, {
    ...(scheduledDate !== undefined ? { scheduledDate } : {}),
    ...workoutOverrides,
  });

  toCleanup.push({ table: "workout", id: workout.id });

  const blocks: TestWorkoutWithBlocks["blocks"] = [];

  for (let b = 0; b < blockCount; b += 1) {
    const block = await rawPrisma.workoutBlock.create({
      data: {
        workoutId: workout.id,
        blockTypeId,
        schemeId,
        schemeKind: "STRAIGHT_SETS",
        schemeConfig: {},
        sortOrder: b,
      },
    });

    toCleanup.push({ table: "workoutBlock", id: block.id });

    const exercises: WorkoutBlockExercise[] = [];

    for (let e = 0; e < exercisesPerBlock; e += 1) {
      const exerciseId = exerciseIds[e % exerciseIds.length];

      if (!exerciseId) {
        continue;
      }

      const blockExercise = await rawPrisma.workoutBlockExercise.create({
        data: {
          blockId: block.id,
          exerciseId,
          repScheme: "STRAIGHT",
          repValues: [5, 5, 5],
          sets: 3,
          sortOrder: e,
        },
      });

      toCleanup.push({ table: "workoutBlockExercise", id: blockExercise.id });
      exercises.push(blockExercise);
    }

    blocks.push({ ...block, exercises, emomSlots: [] });
  }

  return { workout, blocks, toCleanup };
};
