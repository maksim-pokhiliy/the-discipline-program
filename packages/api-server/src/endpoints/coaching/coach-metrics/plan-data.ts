import {
  type NextWorkout,
  type PlanDiscipline,
  type RecentWorkout,
} from "@repo/contracts/coaching/coach-athletes";

import { addDaysInTz, daysBetweenInTz, DAYS_IN_WEEK } from "../../../utils/date-helpers";

import { type PerformedByKey, type WindowedEnrollment } from "./coach-metrics.types";
import { isSessionCompleted, type ScheduledDay } from "./scheduled-day";
import { composeWorkoutTitle } from "./workout-title";

const weekCoversToday = (
  weekStart: Date,
  startOfToday: Date,
  tz: string,
  startOfDayCache: (date: Date) => Date,
): boolean => {
  const normalizedStart = startOfDayCache(weekStart);
  const weekEnd = startOfDayCache(addDaysInTz(normalizedStart, DAYS_IN_WEEK, tz));

  return startOfToday >= normalizedStart && startOfToday < weekEnd;
};

export const pickPrimaryPlan = (
  enrollments: WindowedEnrollment[],
  startOfToday: Date,
  tz: string,
  startOfDayCache: (date: Date) => Date,
): WindowedEnrollment | null => {
  const covering = enrollments.find((enrollment) =>
    enrollment.plan.weeks.some((week) =>
      weekCoversToday(week.startDate, startOfToday, tz, startOfDayCache),
    ),
  );

  if (covering) {
    return covering;
  }

  return enrollments.reduce<WindowedEnrollment | null>((latest, enrollment) => {
    if (!latest || enrollment.boardedAt > latest.boardedAt) {
      return enrollment;
    }

    return latest;
  }, null);
};

export const computeCurrentWeek = (
  primary: WindowedEnrollment | null,
  startOfToday: Date,
  tz: string,
  startOfDayCache: (date: Date) => Date,
  firstWeekStartByPlan: Map<string, Date>,
): number | null => {
  if (!primary) {
    return null;
  }

  const coveringWeek = primary.plan.weeks.find((week) =>
    weekCoversToday(week.startDate, startOfToday, tz, startOfDayCache),
  );
  const firstWeekStart = firstWeekStartByPlan.get(primary.planId);

  if (!coveringWeek || !firstWeekStart) {
    return null;
  }

  const weeksFromStart = Math.round(
    daysBetweenInTz(startOfDayCache(firstWeekStart), startOfDayCache(coveringWeek.startDate), tz) /
      DAYS_IN_WEEK,
  );

  return weeksFromStart + 1;
};

export const buildPlanDiscipline = (
  scheduledDays: ScheduledDay[],
  weekStart: Date,
  weekEnd: Date,
  startOfToday: Date,
  performedByKey: PerformedByKey,
  athleteId: string,
): PlanDiscipline[] => {
  const byPlan = new Map<string, PlanDiscipline>();

  for (const scheduled of scheduledDays) {
    const time = scheduled.date.getTime();

    if (time < weekStart.getTime() || time > weekEnd.getTime()) {
      continue;
    }

    const entry = byPlan.get(scheduled.planId) ?? {
      planId: scheduled.planId,
      planName: scheduled.planName,
      enrolledDate: scheduled.enrolledDate,
      completed: 0,
      available: 0,
      planned: 0,
    };

    for (const session of scheduled.workoutSessions) {
      entry.planned += 1;

      if (time <= startOfToday.getTime()) {
        entry.available += 1;
      }

      if (isSessionCompleted(performedByKey, athleteId, session.id)) {
        entry.completed += 1;
      }
    }

    byPlan.set(scheduled.planId, entry);
  }

  return [...byPlan.values()];
};

export const buildRecentWorkouts = (
  scheduledDays: ScheduledDay[],
  startOfToday: Date,
  limit: number,
  performedByKey: PerformedByKey,
  athleteId: string,
): RecentWorkout[] => {
  const completed: RecentWorkout[] = [];

  for (const scheduled of scheduledDays) {
    if (scheduled.date.getTime() > startOfToday.getTime()) {
      continue;
    }

    for (const session of scheduled.workoutSessions) {
      if (isSessionCompleted(performedByKey, athleteId, session.id)) {
        completed.push({
          id: session.id,
          title: composeWorkoutTitle(session, scheduled.day),
          date: scheduled.date,
          planName: scheduled.planName,
        });
      }
    }
  }

  return completed.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
};

export const findNextWorkout = (
  scheduledDays: ScheduledDay[],
  startOfToday: Date,
): NextWorkout | null => {
  for (const scheduled of scheduledDays) {
    if (scheduled.date.getTime() <= startOfToday.getTime()) {
      continue;
    }

    const session = [...scheduled.workoutSessions].sort((a, b) => a.order - b.order)[0];

    if (session) {
      return {
        title: composeWorkoutTitle(session, scheduled.day),
        date: scheduled.date,
        planName: scheduled.planName,
      };
    }
  }

  return null;
};
