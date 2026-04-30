import type { Prisma, PrismaClient } from "@prisma/client";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  type AthleteDailySummary,
  type ProgressBuckets,
  ADHERENCE_IMPROVING_THRESHOLD,
  ADHERENCE_ON_TRACK_THRESHOLD,
  ProcessStatus,
  TodayStatus,
} from "@repo/contracts/coaching/coach-dashboard";

import { HEALTH_STATUS_MAP } from "../../mappers/coaching";
import { MS_PER_DAY, startOfTodayInTz, startOfWeekInTz } from "../../utils/date-helpers";

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
    (s) => s.completionRatio !== null && Number(s.completionRatio) >= 0.9,
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

  const results = await Promise.all(
    assignments.map(async (a) => {
      const athlete = a.athlete;

      const adherence = await computeAdherenceWindow({
        db,
        userId: athlete.id,
        windowDays: 30,
      });

      return { athlete, adherenceRate: adherence.adherenceRate };
    }),
  );

  const onTrack: ProgressBuckets["onTrack"] = [];
  const steady: ProgressBuckets["steady"] = [];
  const fallingBehind: ProgressBuckets["fallingBehind"] = [];

  let totalRate = 0;

  for (const { athlete, adherenceRate } of results) {
    totalRate += adherenceRate;

    const entry = {
      userId: athlete.id,
      name: athlete.name,
      image: athlete.image,
      processStatus:
        adherenceRate >= 0.8
          ? ProcessStatus.ON_TRACK
          : adherenceRate >= 0.5
            ? ProcessStatus.STEADY
            : ProcessStatus.FALLING_BEHIND,
    };

    if (adherenceRate >= 0.8) {
      onTrack.push(entry);
    } else if (adherenceRate >= 0.5) {
      steady.push(entry);
    } else {
      fallingBehind.push(entry);
    }
  }

  return {
    onTrack,
    steady,
    fallingBehind,
    avgEngagementRate: totalRate / results.length,
  };
};

export const computeAthletesSummary = async ({
  db,
  assignments,
}: {
  db: Db;
  assignments: AssignedAthleteWithData[];
}): Promise<AthleteDailySummary[]> => {
  const summaries: AthleteDailySummary[] = [];

  for (const a of assignments) {
    const athlete = a.athlete;

    const healthStatus = athlete.athleteProfile
      ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY;

    const latestSession = await db.workoutSession.findFirst({
      where: { userId: athlete.id },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    const lastActivityDate = latestSession?.completedAt ?? null;

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
      (s) => s.completionRatio !== null && Number(s.completionRatio) >= 0.9,
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
  const weekEnd = new Date(weekStart.getTime() + 7 * MS_PER_DAY);

  const sessions = await db.workoutSession.findMany({
    where: { userId, startedAt: { gte: weekStart, lt: weekEnd } },
    select: { completionRatio: true },
  });

  return {
    workoutsPlannedThisWeek: sessions.length,
    workoutsCompletedThisWeek: sessions.filter(
      (s) => s.completionRatio !== null && Number(s.completionRatio) >= 0.9,
    ).length,
  };
};
