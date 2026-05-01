import type { Prisma, PrismaClient } from "@prisma/client";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  type AthleteDailySummary,
  type ProgressBuckets,
  ADHERENCE_IMPROVING_THRESHOLD,
  ADHERENCE_ON_TRACK_BUCKET,
  ADHERENCE_ON_TRACK_THRESHOLD,
  ADHERENCE_STEADY_BUCKET,
  ADHERENCE_WINDOW_DAYS,
  ProcessStatus,
  TodayStatus,
  WORKOUT_FULLY_COMPLETED_RATIO,
} from "@repo/contracts/coaching/coach-dashboard";

import { HEALTH_STATUS_MAP } from "../../mappers/coaching";
import {
  addDaysInTz,
  MS_PER_DAY,
  startOfTodayInTz,
  startOfWeekInTz,
} from "../../utils/date-helpers";

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
    const athlete = a.athlete;
    const adherenceRate = adherenceByAthleteId.get(athlete.id) ?? 0;

    totalRate += adherenceRate;

    const entry = {
      userId: athlete.id,
      name: athlete.name,
      image: athlete.image,
      processStatus:
        adherenceRate >= ADHERENCE_ON_TRACK_BUCKET
          ? ProcessStatus.ON_TRACK
          : adherenceRate >= ADHERENCE_STEADY_BUCKET
            ? ProcessStatus.STEADY
            : ProcessStatus.FALLING_BEHIND,
    };

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

const buildLatestSessionMap = async (
  db: Db,
  athleteIds: string[],
): Promise<Map<string, Date | null>> => {
  if (athleteIds.length === 0) {
    return new Map();
  }

  const rows = await db.workoutSession.findMany({
    where: { userId: { in: athleteIds }, completedAt: { not: null } },
    distinct: ["userId"],
    orderBy: [{ userId: "asc" }, { completedAt: "desc" }],
    select: { userId: true, completedAt: true },
  });

  const result = new Map<string, Date | null>();

  for (const id of athleteIds) {
    result.set(id, null);
  }

  for (const r of rows) {
    result.set(r.userId, r.completedAt);
  }

  return result;
};

export const computeAthletesSummary = async ({
  db,
  assignments,
}: {
  db: Db;
  assignments: AssignedAthleteWithData[];
}): Promise<AthleteDailySummary[]> => {
  const athleteIds = assignments.map((a) => a.athlete.id);
  const latestByAthleteId = await buildLatestSessionMap(db, athleteIds);

  const summaries: AthleteDailySummary[] = [];

  for (const a of assignments) {
    const athlete = a.athlete;

    const healthStatus = athlete.athleteProfile
      ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY;

    const lastActivityDate = latestByAthleteId.get(athlete.id) ?? null;

    if (athlete.planEnrollments.length === 0) {
      summaries.push({
        userId: athlete.id,
        name: athlete.name,
        email: athlete.email,
        image: athlete.image,
        planId: null,
        planName: null,
        todayStatus: TodayStatus.NO_SCHEDULE,
        missedCount: 0,
        todayWorkoutTitle: null,
        lastActivityDate,
        daysSinceLastActivity: null,
        healthStatus,
      });
      continue;
    }

    const firstEnrollment = athlete.planEnrollments[0];

    if (!firstEnrollment) {
      continue;
    }

    summaries.push({
      userId: athlete.id,
      name: athlete.name,
      email: athlete.email,
      image: athlete.image,
      planId: firstEnrollment.plan.id,
      planName: firstEnrollment.plan.name,
      todayStatus: TodayStatus.NO_SCHEDULE,
      missedCount: 0,
      todayWorkoutTitle: null,
      lastActivityDate,
      daysSinceLastActivity: null,
      healthStatus,
    });
  }

  return summaries;
};

export const computeTodayStatus = async ({
  db,
  userId,
  timezone,
}: {
  db: Db;
  userId: string;
  timezone: string;
}): Promise<{ workoutsPlannedToday: number; workoutsCompletedToday: number }> => {
  const todayStart = startOfTodayInTz(timezone);
  const todayEnd = new Date(todayStart.getTime() + MS_PER_DAY);

  const sessions = await db.workoutSession.findMany({
    where: { userId, startedAt: { gte: todayStart, lt: todayEnd } },
    select: { completionRatio: true },
  });

  return {
    workoutsPlannedToday: sessions.length,
    workoutsCompletedToday: sessions.filter(
      (s) =>
        s.completionRatio !== null && Number(s.completionRatio) >= WORKOUT_FULLY_COMPLETED_RATIO,
    ).length,
  };
};

export const computeWeekStatus = async ({
  db,
  userId,
  timezone,
}: {
  db: Db;
  userId: string;
  timezone: string;
}): Promise<{ workoutsPlannedThisWeek: number; workoutsCompletedThisWeek: number }> => {
  const today = startOfTodayInTz(timezone);
  const weekStart = startOfWeekInTz(today, timezone);
  const weekEnd = addDaysInTz(weekStart, 7, timezone);

  const sessions = await db.workoutSession.findMany({
    where: { userId, startedAt: { gte: weekStart, lt: weekEnd } },
    select: { completionRatio: true },
  });

  return {
    workoutsPlannedThisWeek: sessions.length,
    workoutsCompletedThisWeek: sessions.filter(
      (s) =>
        s.completionRatio !== null && Number(s.completionRatio) >= WORKOUT_FULLY_COMPLETED_RATIO,
    ).length,
  };
};
