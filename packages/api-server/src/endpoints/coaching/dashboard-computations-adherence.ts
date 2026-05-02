import type { Prisma, PrismaClient } from "@prisma/client";

import {
  type ProgressBuckets,
  ADHERENCE_IMPROVING_THRESHOLD,
  ADHERENCE_ON_TRACK_BUCKET,
  ADHERENCE_ON_TRACK_THRESHOLD,
  ADHERENCE_STEADY_BUCKET,
  ADHERENCE_WINDOW_DAYS,
  ProcessStatus,
  WORKOUT_FULLY_COMPLETED_RATIO,
} from "@repo/contracts/coaching/coach-dashboard";

import { MS_PER_DAY } from "../../utils/date-helpers";

import type { AssignedAthleteWithData } from "./assigned-athlete-query";

type Db = PrismaClient | Prisma.TransactionClient;

export type AdherenceWindow = {
  plannedCount: number;
  completedCount: number;
  adherenceRate: number;
};

export const computeAdherenceWindow = async ({
  db,
  userId,
  windowDays,
}: {
  db: Db;
  userId: string;
  windowDays: number;
}): Promise<AdherenceWindow> => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * MS_PER_DAY);

  const sessions = await db.workoutSession.findMany({
    where: { userId, startedAt: { gte: windowStart, lte: now } },
    select: { completionRatio: true },
  });

  const plannedCount = sessions.length;
  const completedCount = sessions.filter(
    (s) => s.completionRatio !== null && Number(s.completionRatio) >= WORKOUT_FULLY_COMPLETED_RATIO,
  ).length;

  return {
    plannedCount,
    completedCount,
    adherenceRate: plannedCount === 0 ? 0 : completedCount / plannedCount,
  };
};

export const computeProcessStatus = (
  currentAdherence: number,
  previousAdherence: number,
): ProcessStatus => {
  const delta = currentAdherence - previousAdherence;

  if (delta > ADHERENCE_IMPROVING_THRESHOLD) {
    return ProcessStatus.ON_TRACK;
  }

  if (delta < -ADHERENCE_IMPROVING_THRESHOLD) {
    return ProcessStatus.FALLING_BEHIND;
  }

  return currentAdherence >= ADHERENCE_ON_TRACK_THRESHOLD
    ? ProcessStatus.ON_TRACK
    : ProcessStatus.STEADY;
};

const buildAdherenceMap = async (
  db: Db,
  athleteIds: string[],
  windowDays: number,
): Promise<Map<string, number>> => {
  if (athleteIds.length === 0) {
    return new Map();
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * MS_PER_DAY);

  const sessions = await db.workoutSession.findMany({
    where: { userId: { in: athleteIds }, startedAt: { gte: windowStart, lte: now } },
    select: { userId: true, completionRatio: true },
  });

  const planned = new Map<string, number>();
  const completed = new Map<string, number>();

  for (const s of sessions) {
    planned.set(s.userId, (planned.get(s.userId) ?? 0) + 1);

    if (s.completionRatio !== null && Number(s.completionRatio) >= WORKOUT_FULLY_COMPLETED_RATIO) {
      completed.set(s.userId, (completed.get(s.userId) ?? 0) + 1);
    }
  }

  const result = new Map<string, number>();

  for (const id of athleteIds) {
    const total = planned.get(id) ?? 0;
    const done = completed.get(id) ?? 0;

    result.set(id, total === 0 ? 0 : done / total);
  }

  return result;
};

type ProgressEntry = ProgressBuckets["onTrack"][number];

const classifyEntry = (
  athlete: AssignedAthleteWithData["athlete"],
  adherenceRate: number,
): ProgressEntry => ({
  userId: athlete.id,
  name: athlete.name,
  image: athlete.image,
  processStatus:
    adherenceRate >= ADHERENCE_ON_TRACK_BUCKET
      ? ProcessStatus.ON_TRACK
      : adherenceRate >= ADHERENCE_STEADY_BUCKET
        ? ProcessStatus.STEADY
        : ProcessStatus.FALLING_BEHIND,
});

export const computeProgressBuckets = async ({
  db,
  assignments,
}: {
  db: Db;
  assignments: AssignedAthleteWithData[];
}): Promise<ProgressBuckets> => {
  if (assignments.length === 0) {
    return { onTrack: [], steady: [], fallingBehind: [], avgEngagementRate: 0 };
  }

  const athleteIds = assignments.map((a) => a.athlete.id);
  const adherenceByAthleteId = await buildAdherenceMap(db, athleteIds, ADHERENCE_WINDOW_DAYS);

  const onTrack: ProgressBuckets["onTrack"] = [];
  const steady: ProgressBuckets["steady"] = [];
  const fallingBehind: ProgressBuckets["fallingBehind"] = [];

  let totalRate = 0;

  for (const a of assignments) {
    const adherenceRate = adherenceByAthleteId.get(a.athlete.id) ?? 0;

    totalRate += adherenceRate;

    const entry = classifyEntry(a.athlete, adherenceRate);

    if (adherenceRate >= ADHERENCE_ON_TRACK_BUCKET) {
      onTrack.push(entry);
    } else if (adherenceRate >= ADHERENCE_STEADY_BUCKET) {
      steady.push(entry);
    } else {
      fallingBehind.push(entry);
    }
  }

  return {
    onTrack,
    steady,
    fallingBehind,
    avgEngagementRate: totalRate / assignments.length,
  };
};
