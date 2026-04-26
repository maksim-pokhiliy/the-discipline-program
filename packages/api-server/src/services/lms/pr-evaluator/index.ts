import {
  type PersonalRecord as PrismaPersonalRecord,
  type PrismaClient,
  PrKind,
} from "@prisma/client";

import { logger } from "@repo/shared";

import { detectMaxLoadForReps } from "./max-load-for-reps";

export interface EvaluatePrInput {
  db: PrismaClient;
  setLogId: string;
}

export interface EvaluatePrResult {
  created: PrismaPersonalRecord | null;
}

const PR_KIND_FOR_LOAD = PrKind.MAX_LOAD_FOR_REPS;

export const evaluatePr = async ({ db, setLogId }: EvaluatePrInput): Promise<EvaluatePrResult> => {
  const setLog = await db.setLog.findUnique({
    where: { id: setLogId },
    include: {
      exerciseLog: {
        include: {
          blockSession: { include: { workoutSession: { select: { userId: true } } } },
        },
      },
    },
  });

  if (!setLog) {
    return { created: null };
  }

  const userId = setLog.exerciseLog.blockSession.workoutSession.userId;
  const exerciseId = setLog.exerciseLog.exerciseId;

  const existing = await db.personalRecord.findUnique({
    where: {
      userId_exerciseId_kind: {
        userId,
        exerciseId,
        kind: PR_KIND_FOR_LOAD,
      },
    },
  });

  const decision = detectMaxLoadForReps(setLog, existing);

  if (decision.kind === "none") {
    logger.info("lms.pr_evaluator.evaluated", {
      setLogId,
      userId,
      exerciseId,
      kind: PR_KIND_FOR_LOAD,
      result: "none",
    });

    return { created: null };
  }

  const achievedAt = setLog.completedAt ?? new Date();

  const upserted = await db.personalRecord.upsert({
    where: {
      userId_exerciseId_kind: {
        userId,
        exerciseId,
        kind: PR_KIND_FOR_LOAD,
      },
    },
    create: {
      userId,
      exerciseId,
      kind: PR_KIND_FOR_LOAD,
      value: decision.value,
      unit: "kg",
      context: { fixedReps: decision.context.fixedReps },
      achievedAt,
      sourceSetLogId: setLogId,
    },
    update: {
      value: decision.value,
      unit: "kg",
      context: { fixedReps: decision.context.fixedReps },
      achievedAt,
      sourceSetLogId: setLogId,
    },
  });

  logger.info("lms.athlete.pr_achieved", {
    setLogId,
    userId,
    exerciseId,
    kind: PR_KIND_FOR_LOAD,
    value: upserted.value.toString(),
    fixedReps: decision.context.fixedReps,
  });

  return { created: upserted };
};
