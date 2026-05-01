import {
  type BlockSession,
  type ExerciseLog,
  type Prisma,
  PrismaClient,
  type SetLog,
  type WorkoutSession,
} from "@prisma/client";

import { BODY_PART_MAP, MODALITY_MAP, MOVEMENT_PATTERN_MAP } from "../mappers/lms";
import { findOrThrow } from "../utils";

const rawPrisma = new PrismaClient();

export const createTestWorkoutSession = async (params: {
  userId: string;
  enrollmentId?: string;
  overrides?: Partial<Prisma.WorkoutSessionUncheckedCreateInput>;
}): Promise<WorkoutSession> => {
  const { userId, enrollmentId, overrides = {} } = params;

  return rawPrisma.workoutSession.create({
    data: {
      userId,
      ...(enrollmentId !== undefined && { enrollmentId }),
      status: "COMPLETED",
      completionRatio: 1.0,
      startedAt: new Date(),
      completedAt: new Date(),
      durationSec: 3600,
      ...overrides,
    },
  });
};

export const createTestBlockSession = async (params: {
  workoutSessionId: string;
  overrides?: Partial<Prisma.BlockSessionUncheckedCreateInput>;
}): Promise<BlockSession> => {
  const { workoutSessionId, overrides = {} } = params;

  return rawPrisma.blockSession.create({
    data: {
      workoutSessionId,
      order: 0,
      kindName: "STRENGTH",
      weight: 100,
      archetypeKind: "NONE",
      schemeParamsSnapshot: {},
      rxStatus: "RX",
      ...overrides,
    },
  });
};

export const createTestExerciseLog = async (params: {
  blockSessionId: string;
  exerciseId: string;
  overrides?: Partial<Prisma.ExerciseLogUncheckedCreateInput>;
}): Promise<ExerciseLog> => {
  const { blockSessionId, exerciseId, overrides = {} } = params;

  const exercise = await findOrThrow(
    rawPrisma.exerciseLibraryItem.findUnique({ where: { id: exerciseId } }),
    "Exercise library item",
  );

  const exerciseSnapshot: Prisma.InputJsonValue = {
    id: exercise.id,
    name: exercise.name,
    primaryMovement: MOVEMENT_PATTERN_MAP[exercise.primaryMovement],
    modality: MODALITY_MAP[exercise.modality],
    primaryBodyParts: exercise.primaryBodyParts.map((bp) => BODY_PART_MAP[bp]),
    defaultMetrics: exercise.defaultMetrics,
    demoVideoUrl: exercise.demoVideoUrl,
    demoImageUrl: exercise.demoImageUrl,
  };

  return rawPrisma.exerciseLog.create({
    data: {
      blockSessionId,
      exerciseId,
      exerciseSnapshot,
      order: 0,
      ...overrides,
    },
  });
};

export const createTestSetLog = async (params: {
  exerciseLogId: string;
  overrides?: Partial<Prisma.SetLogUncheckedCreateInput>;
}): Promise<SetLog> => {
  const { exerciseLogId, overrides = {} } = params;

  const actual: Prisma.InputJsonValue = {
    reps: 5,
    load: 100,
    durationSec: null,
    distanceM: null,
    calories: null,
    rpe: 7,
  };

  const prescribed: Prisma.InputJsonValue = {
    reps: 5,
    load: 100,
    durationSec: null,
    distanceM: null,
    calories: null,
    rpe: null,
  };

  return rawPrisma.setLog.create({
    data: {
      exerciseLogId,
      order: 0,
      prescribed,
      actual,
      ...overrides,
    },
  });
};
