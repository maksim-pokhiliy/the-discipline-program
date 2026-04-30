import {
  type PersonalRecord as PrismaPersonalRecord,
  type Prisma,
  type PrismaClient,
  PrKind,
} from "@prisma/client";

import { type ExerciseDefaultMetrics } from "@repo/contracts/lms/exercise-library-item";
import { logger } from "@repo/shared";

import { dispatchDetector, upsertPersonalRecord } from "./_dispatch";

export interface EvaluatePrInput {
  db: PrismaClient | Prisma.TransactionClient;
  setLogId: string;
}

export interface EvaluatePrResult {
  created: PrismaPersonalRecord[];
}

const resolveKinds = (metrics: ExerciseDefaultMetrics): PrKind[] => {
  const kinds: PrKind[] = [];

  if (metrics.canMeasureLoad && metrics.canMeasureReps) {
    kinds.push(PrKind.MAX_LOAD_FOR_REPS, PrKind.ONE_REP_MAX, PrKind.N_REP_MAX);
  }

  if (metrics.canMeasureReps) {
    kinds.push(PrKind.MAX_REPS_UNBROKEN, PrKind.MAX_REPS_TOTAL);
  }

  if (metrics.canMeasureDuration) {
    kinds.push(PrKind.BEST_TIME_FOR_X);
  }

  if (metrics.canMeasureDistance) {
    kinds.push(PrKind.MAX_DISTANCE_IN_T);
  }

  if (metrics.canMeasureCalories) {
    kinds.push(PrKind.MAX_CALORIES_IN_T);
  }

  return kinds;
};

export const evaluatePr = async ({ db, setLogId }: EvaluatePrInput): Promise<EvaluatePrResult> => {
  const setLog = await db.setLog.findUnique({
    where: { id: setLogId },
    include: {
      exerciseLog: {
        include: {
          blockSession: { include: { workoutSession: { select: { userId: true } } } },
          exercise: { select: { defaultMetrics: true } },
        },
      },
    },
  });

  if (!setLog) {
    return { created: [] };
  }

  const userId = setLog.exerciseLog.blockSession.workoutSession.userId;
  const exerciseId = setLog.exerciseLog.exerciseId;
  const metrics = setLog.exerciseLog.exercise.defaultMetrics as ExerciseDefaultMetrics;
  const kinds = resolveKinds(metrics);

  if (kinds.length === 0) {
    logger.info("lms.pr_evaluator.dispatched", {
      setLogId,
      userId,
      exerciseId,
      kindsEvaluated: [],
      kindsAchieved: [],
    });

    return { created: [] };
  }

  const needsSiblings =
    kinds.includes(PrKind.MAX_REPS_TOTAL) || kinds.includes(PrKind.MAX_REPS_UNBROKEN);

  const siblings = needsSiblings
    ? await db.setLog.findMany({ where: { exerciseLogId: setLog.exerciseLogId } })
    : null;

  const achievedAt = setLog.completedAt ?? new Date();
  const kindsAchieved: PrKind[] = [];
  const createdPrs: PrismaPersonalRecord[] = [];

  for (const prKind of kinds) {
    const existing = await db.personalRecord.findUnique({
      where: { userId_exerciseId_kind: { userId, exerciseId, kind: prKind } },
    });

    const output = dispatchDetector({ prKind, setLog, siblings, existing });

    if (output === null) {
      continue;
    }

    const pr = await upsertPersonalRecord(db, {
      userId,
      exerciseId,
      prKind,
      setLogId,
      achievedAt,
      output,
    });

    kindsAchieved.push(prKind);
    createdPrs.push(pr);
  }

  logger.info("lms.pr_evaluator.dispatched", {
    setLogId,
    userId,
    exerciseId,
    kindsEvaluated: kinds,
    kindsAchieved,
  });

  return { created: createdPrs };
};
