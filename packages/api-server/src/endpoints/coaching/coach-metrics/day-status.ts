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

const isBucketCompleted = (
  bucket: DayBucket,
  performedByKey: PerformedByKey,
  athleteId: string,
): boolean =>
  bucket.workoutSessions.every((session) =>
    isSessionCompleted(performedByKey, athleteId, session.id),
  );

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

  if (isBucketCompleted(bucket, performedByKey, athleteId)) {
    return TodayStatus.COMPLETED;
  }

  return isToday ? TodayStatus.PENDING : TodayStatus.MISSED;
};
