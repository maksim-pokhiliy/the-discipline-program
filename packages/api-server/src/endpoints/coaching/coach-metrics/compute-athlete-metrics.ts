import { ADHERENCE_WINDOW_DAYS } from "@repo/contracts/coaching/coach-dashboard";

import { addDaysInTz, endOfWeekInTz, startOfWeekInTz } from "../../../utils/date-helpers";

import {
  bucketProcessStatus,
  computeWeeklyDelta,
  ratioOf,
  tallyWorkoutSessions,
  toPercent,
} from "./adherence";
import { RECENT_WORKOUTS_LIMIT } from "./coach-metrics.constants";
import {
  type AthleteMetricsResult,
  type PerformedByKey,
  type WindowedEnrollment,
} from "./coach-metrics.types";
import { computeLastActivity } from "./last-activity";
import { buildLast7Days } from "./last7-days";
import { computeStreakMetrics, countMissedSessions } from "./missed-and-streak";
import {
  buildPlanDiscipline,
  buildRecentWorkouts,
  computeCurrentWeek,
  findNextWorkout,
  pickPrimaryPlan,
} from "./plan-data";
import { buildScheduledDays, type ScheduledDay } from "./scheduled-day";
import { composeTodayWorkoutTitle, deriveTodayStatus } from "./today-status";

type ComputeAthleteMetricsArgs = {
  athleteId: string;
  enrollments: WindowedEnrollment[];
  performedByKey: PerformedByKey;
  weekCountByPlan: Map<string, number>;
  firstWeekStartByPlan: Map<string, Date>;
  tz: string;
  now: Date;
  startOfDayCache: (date: Date) => Date;
};

const inRange = (date: Date, fromInclusive: Date, toExclusive: Date): boolean =>
  date.getTime() >= fromInclusive.getTime() && date.getTime() < toExclusive.getTime();

const filterScheduled = (
  scheduledDays: ScheduledDay[],
  fromInclusive: Date,
  toExclusive: Date,
): ScheduledDay[] =>
  scheduledDays.filter((scheduled) => inRange(scheduled.date, fromInclusive, toExclusive));

export const computeAthleteMetrics = ({
  athleteId,
  enrollments,
  performedByKey,
  weekCountByPlan,
  firstWeekStartByPlan,
  tz,
  now,
  startOfDayCache,
}: ComputeAthleteMetricsArgs): AthleteMetricsResult => {
  const startOfToday = startOfDayCache(now);
  const weekStart = startOfWeekInTz(now, tz);
  const weekEnd = endOfWeekInTz(now, tz);
  const adherenceStart = startOfDayCache(addDaysInTz(startOfToday, -ADHERENCE_WINDOW_DAYS, tz));
  const lastWeekStart = startOfDayCache(addDaysInTz(weekStart, -7, tz));

  const scheduledDays = buildScheduledDays(enrollments, tz, startOfDayCache);
  const todayDays = scheduledDays.filter(
    (scheduled) => scheduled.date.getTime() === startOfToday.getTime(),
  );

  const adherenceTally = tallyWorkoutSessions(
    filterScheduled(scheduledDays, adherenceStart, startOfToday),
    performedByKey,
    athleteId,
  );
  const adherenceRate = ratioOf(adherenceTally);

  const thisWeekTally = tallyWorkoutSessions(
    filterScheduled(scheduledDays, weekStart, addDaysInTz(startOfToday, 1, tz)),
    performedByKey,
    athleteId,
  );
  const lastWeekTally = tallyWorkoutSessions(
    filterScheduled(scheduledDays, lastWeekStart, weekStart),
    performedByKey,
    athleteId,
  );

  const { currentStreak, consecutiveMissedDays } = computeStreakMetrics(
    scheduledDays,
    startOfToday,
    tz,
    startOfDayCache,
    performedByKey,
    athleteId,
  );

  const primary = pickPrimaryPlan(enrollments, startOfToday, tz, startOfDayCache);

  return {
    primaryPlanId: primary?.planId ?? null,
    primaryPlanName: primary?.plan.name ?? null,
    todayStatus: deriveTodayStatus(todayDays, performedByKey, athleteId),
    todayWorkoutTitle: composeTodayWorkoutTitle(todayDays),
    missedCount: countMissedSessions(scheduledDays, startOfToday, null, performedByKey, athleteId),
    missedThisWeek: countMissedSessions(
      scheduledDays,
      startOfToday,
      weekStart,
      performedByKey,
      athleteId,
    ),
    consecutiveMissedDays,
    ...computeLastActivity(scheduledDays, performedByKey, athleteId, now, tz),
    adherenceRate,
    processStatus: bucketProcessStatus(adherenceRate),
    engagementPct: toPercent(adherenceRate),
    weeklyDelta: computeWeeklyDelta(thisWeekTally, lastWeekTally),
    planDiscipline: buildPlanDiscipline(
      scheduledDays,
      weekStart,
      weekEnd,
      startOfToday,
      performedByKey,
      athleteId,
    ),
    recentWorkouts: buildRecentWorkouts(
      scheduledDays,
      startOfToday,
      RECENT_WORKOUTS_LIMIT,
      performedByKey,
      athleteId,
    ),
    nextWorkout: findNextWorkout(scheduledDays, startOfToday),
    last7Days: buildLast7Days(
      scheduledDays,
      startOfToday,
      tz,
      startOfDayCache,
      performedByKey,
      athleteId,
    ),
    currentWeek: computeCurrentWeek(
      primary,
      startOfToday,
      tz,
      startOfDayCache,
      firstWeekStartByPlan,
    ),
    totalWeeks: primary ? (weekCountByPlan.get(primary.planId) ?? 0) : 0,
    currentStreak,
  };
};
