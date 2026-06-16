import { ADHERENCE_WINDOW_DAYS, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { addDaysInTz } from "../../../utils/date-helpers";

import { type PerformedByKey } from "./coach-metrics.types";
import { buildDaysByDate, classifyDate, type DayBucket } from "./day-status";
import { isSessionCompleted, type ScheduledDay } from "./scheduled-day";

type WalkContext = {
  byDate: Map<number, DayBucket>;
  startOfToday: Date;
  tz: string;
  startOfDayCache: (date: Date) => Date;
  performedByKey: PerformedByKey;
  athleteId: string;
};

const classifyPastDay = (context: WalkContext, offset: number): TodayStatus => {
  const date = context.startOfDayCache(addDaysInTz(context.startOfToday, -offset, context.tz));

  return classifyDate(
    context.byDate.get(date.getTime()),
    false,
    context.performedByKey,
    context.athleteId,
  );
};

const walkBackForRun = (context: WalkContext, target: TodayStatus): number => {
  let run = 0;

  for (let offset = 1; offset <= ADHERENCE_WINDOW_DAYS; offset += 1) {
    const status = classifyPastDay(context, offset);

    if (status === TodayStatus.REST_DAY || status === TodayStatus.NO_SCHEDULE) {
      continue;
    }

    if (status === target) {
      run += 1;
    } else {
      break;
    }
  }

  return run;
};

export const computeStreakMetrics = (
  scheduledDays: ScheduledDay[],
  startOfToday: Date,
  tz: string,
  startOfDayCache: (date: Date) => Date,
  performedByKey: PerformedByKey,
  athleteId: string,
): { currentStreak: number; consecutiveMissedDays: number } => {
  const context: WalkContext = {
    byDate: buildDaysByDate(scheduledDays),
    startOfToday,
    tz,
    startOfDayCache,
    performedByKey,
    athleteId,
  };

  return {
    currentStreak: walkBackForRun(context, TodayStatus.COMPLETED),
    consecutiveMissedDays: walkBackForRun(context, TodayStatus.MISSED),
  };
};

export const countMissedSessions = (
  scheduledDays: ScheduledDay[],
  startOfToday: Date,
  rangeStart: Date | null,
  performedByKey: PerformedByKey,
  athleteId: string,
): number => {
  let missed = 0;

  for (const scheduled of scheduledDays) {
    const time = scheduled.date.getTime();
    const isPast = time < startOfToday.getTime();
    const isInRange = rangeStart === null || time >= rangeStart.getTime();

    if (!isPast || !isInRange) {
      continue;
    }

    for (const session of scheduled.workoutSessions) {
      if (!isSessionCompleted(performedByKey, athleteId, session.id)) {
        missed += 1;
      }
    }
  }

  return missed;
};
