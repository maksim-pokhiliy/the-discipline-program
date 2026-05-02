import {
  type PersonalRecord as PrismaPersonalRecord,
  type Prisma,
  type PrismaClient,
  PrKind,
} from "@prisma/client";

import {
  type ExerciseDefaultMetrics,
  exerciseDefaultMetricsSchema,
} from "@repo/contracts/lms/exercise-library-item";
import { InternalServerError } from "@repo/errors";
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
  const parsedMetrics = exerciseDefaultMetricsSchema.safeParse(
    setLog.exerciseLog.exercise.defaultMetrics,
  );

  if (!parsedMetrics.success) {
    throw new InternalServerError("Exercise defaultMetrics parse failure", {
      exerciseId,
      error: parsedMetrics.error.message,
    });
  }

  const kinds = resolveKinds(parsedMetrics.data);

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

  const [siblings, existingRecords] = await Promise.all([
    needsSiblings
      ? db.setLog.findMany({ where: { exerciseLogId: setLog.exerciseLogId } })
      : Promise.resolve(null),
    db.personalRecord.findMany({
      where: { userId, exerciseId, kind: { in: kinds } },
    }),
  ]);

  const existingByKind = new Map(existingRecords.map((pr) => [pr.kind, pr]));

  const achievedAt = setLog.completedAt ?? new Date();
  const upserts: Promise<PrismaPersonalRecord>[] = [];
  const kindsAchieved: PrKind[] = [];

  for (const prKind of kinds) {
    const existing = existingByKind.get(prKind) ?? null;
    const output = dispatchDetector({ prKind, setLog, siblings, existing });

    if (output === null) {
      continue;
    }

    upserts.push(
      upsertPersonalRecord(db, {
        userId,
        exerciseId,
        prKind,
        setLogId,
        achievedAt,
        output,
      }),
    );
    kindsAchieved.push(prKind);
  }

  const createdPrs = await Promise.all(upserts);

  logger.info("lms.pr_evaluator.dispatched", {
    setLogId,
    userId,
    exerciseId,
    kindsEvaluated: kinds,
    kindsAchieved,
  });

  return { created: createdPrs };
};
