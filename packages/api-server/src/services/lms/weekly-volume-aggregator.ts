import { type Prisma, type PrismaClient, type WeeklyVolume } from "@prisma/client";

import { type LoadSpec } from "@repo/contracts/lms/_domain";
import { logger } from "@repo/shared";

export interface AggregateWeeklyVolumeInput {
  db: PrismaClient | Prisma.TransactionClient;
  userId: string;
  weekStartDate: Date;
}

const FULLY_COMPLETED_THRESHOLD = 0.9;
const PARTIALLY_COMPLETED_THRESHOLD = 0.3;

interface SetLogActual {
  load?: LoadSpec;
  reps?: number;
}

const parseActual = (actual: Prisma.JsonValue): SetLogActual | null => {
  if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
    return null;
  }

  return actual as unknown as SetLogActual;
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

export async function aggregateWeeklyVolume(
  input: AggregateWeeklyVolumeInput,
): Promise<WeeklyVolume> {
  const { db, userId, weekStartDate } = input;

  try {
    const weekEnd = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

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

    let totalTonnageKg = 0;
    const tonnageByPattern: Record<string, number> = {};

    let workoutsFullyCompleted = 0;
    let workoutsPartiallyCompleted = 0;
    let workoutsMissed = 0;

    let workoutsRx = 0;
    let workoutsScaled = 0;

    let totalDurationSec = 0;

    for (const session of sessions) {
      const ratio = session.completionRatio !== null ? Number(session.completionRatio) : 0;

      if (ratio >= FULLY_COMPLETED_THRESHOLD) {
        workoutsFullyCompleted++;
      } else if (ratio >= PARTIALLY_COMPLETED_THRESHOLD) {
        workoutsPartiallyCompleted++;
      } else {
        workoutsMissed++;
      }

      totalDurationSec += session.durationSec ?? 0;

      for (const blockSession of session.blockSessions) {
        if (blockSession.rxStatus === "RX") {
          workoutsRx++;
        } else if (blockSession.rxStatus === "SCALED") {
          workoutsScaled++;
        }

        for (const exerciseLog of blockSession.exerciseLogs) {
          const primaryMovement = exerciseLog.exercise.primaryMovement;

          for (const setLog of exerciseLog.setLogs) {
            const parsed = parseActual(setLog.actual);

            if (!parsed) {
              continue;
            }

            const loadKg = extractLoadKg(parsed.load);
            const reps = parsed.reps;

            if (typeof reps !== "number" || reps <= 0 || loadKg === null || loadKg <= 0) {
              continue;
            }

            const tonnage = loadKg * reps;

            totalTonnageKg += tonnage;

            if (primaryMovement !== null && primaryMovement !== undefined) {
              tonnageByPattern[primaryMovement] =
                (tonnageByPattern[primaryMovement] ?? 0) + tonnage;
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
        totalTonnageKg,
        tonnageByPattern: tonnageByPattern as Prisma.InputJsonValue,
        workoutsScheduled,
        workoutsFullyCompleted,
        workoutsPartiallyCompleted,
        workoutsMissed,
        workoutsRx,
        workoutsScaled,
        totalDurationSec,
        recomputedAt,
      },
      update: {
        totalTonnageKg,
        tonnageByPattern: tonnageByPattern as Prisma.InputJsonValue,
        workoutsScheduled,
        workoutsFullyCompleted,
        workoutsPartiallyCompleted,
        workoutsMissed,
        workoutsRx,
        workoutsScaled,
        totalDurationSec,
        recomputedAt,
      },
    });

    logger.info("lms.weekly_volume.aggregated", {
      userId,
      weekStartDate,
      totalTonnageKg,
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
