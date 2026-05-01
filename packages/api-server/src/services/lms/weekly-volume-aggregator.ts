import { type Prisma, type PrismaClient, type SetLog, type WeeklyVolume } from "@prisma/client";

import { type LoadSpec } from "@repo/contracts/lms/_domain";
import { type SetActualResult, setActualResultSchema } from "@repo/contracts/lms/set-log";
import { logger } from "@repo/shared";

import { addDaysInTz, DAYS_IN_WEEK, MS_PER_DAY } from "../../utils/date-helpers";

export interface AggregateWeeklyVolumeInput {
  db: PrismaClient | Prisma.TransactionClient;
  userId: string;
  weekStartDate: Date;
  timezone?: string;
}

const FULLY_COMPLETED_THRESHOLD = 0.9;
const PARTIALLY_COMPLETED_THRESHOLD = 0.3;
const WEEK_DURATION_MS = DAYS_IN_WEEK * MS_PER_DAY - 1;

type SetLogActual = SetActualResult;

const parseActual = (actual: Prisma.JsonValue): SetLogActual | null => {
  const result = setActualResultSchema.safeParse(actual);

  return result.success ? result.data : null;
};

const extractLoadKg = (load: LoadSpec | undefined): number | null => {
  if (!load) {
    return null;
  }

  switch (load.kind) {
    case "SINGLE_DB":
    case "KB":
    case "BARBELL": {
      return load.kg;
    }
    case "DOUBLE_DB": {
      return load.kgEach;
    }
    default: {
      return null;
    }
  }
};

const extractTonnageFromSetLog = (
  setLog: SetLog,
  primaryMovement: string | null,
): { tonnage: number; pattern: string | null } | null => {
  const parsed = parseActual(setLog.actual);

  if (!parsed) {
    return null;
  }

  const loadKg = extractLoadKg(parsed.load);
  const reps = parsed.reps;

  if (typeof reps !== "number" || reps <= 0 || loadKg === null || loadKg <= 0) {
    return null;
  }

  return {
    tonnage: loadKg * reps,
    pattern: primaryMovement,
  };
};

type SessionCounters = {
  workoutsFullyCompleted: number;
  workoutsPartiallyCompleted: number;
  workoutsMissed: number;
  workoutsRx: number;
  workoutsScaled: number;
  totalDurationSec: number;
  totalTonnageKg: number;
  tonnageByPattern: Record<string, number>;
};

const accumulateRatio = (counters: SessionCounters, ratio: number): void => {
  if (ratio >= FULLY_COMPLETED_THRESHOLD) {
    counters.workoutsFullyCompleted++;
  } else if (ratio >= PARTIALLY_COMPLETED_THRESHOLD) {
    counters.workoutsPartiallyCompleted++;
  } else {
    counters.workoutsMissed++;
  }
};

const accumulateTonnage = (
  counters: SessionCounters,
  contribution: { tonnage: number; pattern: string | null },
): void => {
  counters.totalTonnageKg += contribution.tonnage;

  if (contribution.pattern !== null) {
    counters.tonnageByPattern[contribution.pattern] =
      (counters.tonnageByPattern[contribution.pattern] ?? 0) + contribution.tonnage;
  }
};

export async function aggregateWeeklyVolume(
  input: AggregateWeeklyVolumeInput,
): Promise<WeeklyVolume> {
  const { db, userId, weekStartDate, timezone } = input;

  try {
    const weekEnd = timezone
      ? new Date(addDaysInTz(weekStartDate, DAYS_IN_WEEK, timezone).getTime() - 1)
      : new Date(weekStartDate.getTime() + WEEK_DURATION_MS);

    const sessions = await db.workoutSession.findMany({
      where: {
        userId,
        startedAt: { gte: weekStartDate, lte: weekEnd },
      },
      include: {
        blockSessions: {
          include: {
            exerciseLogs: {
              include: {
                exercise: { select: { primaryMovement: true } },
                setLogs: true,
              },
            },
          },
        },
      },
    });

    const counters: SessionCounters = {
      workoutsFullyCompleted: 0,
      workoutsPartiallyCompleted: 0,
      workoutsMissed: 0,
      workoutsRx: 0,
      workoutsScaled: 0,
      totalDurationSec: 0,
      totalTonnageKg: 0,
      tonnageByPattern: {},
    };

    for (const session of sessions) {
      const ratio = session.completionRatio !== null ? Number(session.completionRatio) : 0;

      accumulateRatio(counters, ratio);
      counters.totalDurationSec += session.durationSec ?? 0;

      for (const blockSession of session.blockSessions) {
        if (blockSession.rxStatus === "RX") {
          counters.workoutsRx++;
        } else if (blockSession.rxStatus === "SCALED") {
          counters.workoutsScaled++;
        }

        for (const exerciseLog of blockSession.exerciseLogs) {
          for (const setLog of exerciseLog.setLogs) {
            const contribution = extractTonnageFromSetLog(
              setLog,
              exerciseLog.exercise.primaryMovement,
            );

            if (contribution !== null) {
              accumulateTonnage(counters, contribution);
            }
          }
        }
      }
    }

    const workoutsScheduled = sessions.length;
    const recomputedAt = new Date();

    const result = await db.weeklyVolume.upsert({
      where: { userId_weekStartDate: { userId, weekStartDate } },
      create: {
        userId,
        weekStartDate,
        totalTonnageKg: counters.totalTonnageKg,
        tonnageByPattern: counters.tonnageByPattern as Prisma.InputJsonValue,
        workoutsScheduled,
        workoutsFullyCompleted: counters.workoutsFullyCompleted,
        workoutsPartiallyCompleted: counters.workoutsPartiallyCompleted,
        workoutsMissed: counters.workoutsMissed,
        workoutsRx: counters.workoutsRx,
        workoutsScaled: counters.workoutsScaled,
        totalDurationSec: counters.totalDurationSec,
        recomputedAt,
      },
      update: {
        totalTonnageKg: counters.totalTonnageKg,
        tonnageByPattern: counters.tonnageByPattern as Prisma.InputJsonValue,
        workoutsScheduled,
        workoutsFullyCompleted: counters.workoutsFullyCompleted,
        workoutsPartiallyCompleted: counters.workoutsPartiallyCompleted,
        workoutsMissed: counters.workoutsMissed,
        workoutsRx: counters.workoutsRx,
        workoutsScaled: counters.workoutsScaled,
        totalDurationSec: counters.totalDurationSec,
        recomputedAt,
      },
    });

    logger.info("lms.weekly_volume.aggregated", {
      userId,
      weekStartDate,
      totalTonnageKg: counters.totalTonnageKg,
    });

    return result;
  } catch (err) {
    logger.error("lms.weekly_volume.aggregation_failed", {
      err,
      userId,
      weekStartDate,
    });
    throw err;
  }
}
