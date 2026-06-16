import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { type PerformedByKey, type WindowedSession } from "./coach-metrics.types";
import { isSessionCompleted, type ScheduledDay } from "./scheduled-day";

export type DayBucket = {
  workoutSessions: WindowedSession[];
  hasSchedule: boolean;
};

export const buildDaysByDate = (scheduledDays: ScheduledDay[]): Map<number, DayBucket> => {
  const byDate = new Map<number, DayBucket>();

  for (const scheduled of scheduledDays) {
    const key = scheduled.date.getTime();
    const existing = byDate.get(key);

    if (existing) {
      existing.workoutSessions.push(...scheduled.workoutSessions);
    } else {
      byDate.set(key, { workoutSessions: [...scheduled.workoutSessions], hasSchedule: true });
    }
  }

  return byDate;
};

const countCompletedSessions = (
  bucket: DayBucket,
  performedByKey: PerformedByKey,
  athleteId: string,
): number =>
  bucket.workoutSessions.filter((session) =>
    isSessionCompleted(performedByKey, athleteId, session.id),
  ).length;

export const classifyDate = (
  bucket: DayBucket | undefined,
  isToday: boolean,
  performedByKey: PerformedByKey,
  athleteId: string,
): TodayStatus => {
  if (!bucket) {
    return TodayStatus.NO_SCHEDULE;
  }

  if (bucket.workoutSessions.length === 0) {
    return TodayStatus.REST_DAY;
  }

  const completedCount = countCompletedSessions(bucket, performedByKey, athleteId);

  if (completedCount === bucket.workoutSessions.length) {
    return TodayStatus.COMPLETED;
  }

  if (isToday) {
    return TodayStatus.PENDING;
  }

  return completedCount > 0 ? TodayStatus.COMPLETED : TodayStatus.MISSED;
};
