import {
  type BlockSession,
  type ExerciseLog,
  type Prisma,
  PrismaClient,
  type SetLog,
  type WorkoutSession,
} from "@prisma/client";

const rawPrisma = new PrismaClient();

export const createTestWorkoutSession = async (params: {
  userId: string;
  overrides?: Partial<Prisma.WorkoutSessionUncheckedCreateInput>;
}): Promise<WorkoutSession> => {
  const { userId, overrides = {} } = params;

  return rawPrisma.workoutSession.create({
    data: {
      userId,
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
  exerciseSnapshot?: Prisma.InputJsonObject;
  overrides?: Partial<Prisma.ExerciseLogUncheckedCreateInput>;
}): Promise<ExerciseLog> => {
  const { blockSessionId, exerciseSnapshot, overrides = {} } = params;

  return rawPrisma.exerciseLog.create({
    data: {
      blockSessionId,
      exerciseSnapshot: exerciseSnapshot ?? {
        name: "Test Exercise",
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: ["LOAD", "REPS"],
      },
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
