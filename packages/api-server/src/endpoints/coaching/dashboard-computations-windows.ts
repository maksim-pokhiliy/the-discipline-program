import type { Prisma, PrismaClient } from "@prisma/client";

import { WORKOUT_FULLY_COMPLETED_RATIO } from "@repo/contracts/coaching/coach-dashboard";

import {
  addDaysInTz,
  MS_PER_DAY,
  startOfTodayInTz,
  startOfWeekInTz,
} from "../../utils/date-helpers";

type Db = PrismaClient | Prisma.TransactionClient;

const DAYS_IN_WEEK = 7;

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
  const weekEnd = addDaysInTz(weekStart, DAYS_IN_WEEK, timezone);

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
