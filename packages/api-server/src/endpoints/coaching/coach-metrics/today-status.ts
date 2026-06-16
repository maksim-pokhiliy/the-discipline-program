import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { type PerformedByKey } from "./coach-metrics.types";
import { isSessionCompleted, type ScheduledDay } from "./scheduled-day";
import { composeWorkoutTitle } from "./workout-title";

export const deriveTodayStatus = (
  todayDays: ScheduledDay[],
  performedByKey: PerformedByKey,
  athleteId: string,
): TodayStatus => {
  if (todayDays.length === 0) {
    return TodayStatus.NO_SCHEDULE;
  }

  const workoutSessions = todayDays.flatMap((scheduled) => scheduled.workoutSessions);

  if (workoutSessions.length === 0) {
    return TodayStatus.REST_DAY;
  }

  const allCompleted = workoutSessions.every((session) =>
    isSessionCompleted(performedByKey, athleteId, session.id),
  );

  return allCompleted ? TodayStatus.COMPLETED : TodayStatus.PENDING;
};

export const composeTodayWorkoutTitle = (todayDays: ScheduledDay[]): string | null => {
  for (const scheduled of todayDays) {
    const session = scheduled.workoutSessions[0];

    if (session) {
      return composeWorkoutTitle(session, scheduled.day);
    }
  }

  return null;
};
