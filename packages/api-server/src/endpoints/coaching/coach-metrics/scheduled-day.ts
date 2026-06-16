import { addDaysInTz } from "../../../utils/date-helpers";

import { DAY_OF_WEEK_OFFSET } from "./coach-metrics.constants";
import {
  buildPerformedKey,
  type PerformedByKey,
  type WindowedDay,
  type WindowedEnrollment,
  type WindowedSession,
} from "./coach-metrics.types";

export type ScheduledDay = {
  date: Date;
  planId: string;
  planName: string;
  enrolledDate: Date;
  day: WindowedDay;
  workoutSessions: WindowedSession[];
  isRest: boolean;
};

const isRestSession = (session: WindowedSession): boolean => session.label?.rest === true;

const isRestDay = (day: WindowedDay, workoutSessions: WindowedSession[]): boolean =>
  day.label?.rest === true || workoutSessions.length === 0;

export const isSessionCompleted = (
  performedByKey: PerformedByKey,
  athleteId: string,
  sessionId: string,
): boolean => performedByKey.get(buildPerformedKey(athleteId, sessionId))?.completedAt != null;

export const buildScheduledDays = (
  enrollments: WindowedEnrollment[],
  tz: string,
  startOfDayCache: (date: Date) => Date,
): ScheduledDay[] => {
  const scheduled: ScheduledDay[] = [];

  for (const enrollment of enrollments) {
    for (const week of enrollment.plan.weeks) {
      for (const day of week.days) {
        const date = startOfDayCache(
          addDaysInTz(week.startDate, DAY_OF_WEEK_OFFSET[day.dayOfWeek], tz),
        );
        const workoutSessions = day.sessions.filter((session) => !isRestSession(session));

        scheduled.push({
          date,
          planId: enrollment.planId,
          planName: enrollment.plan.name,
          enrolledDate: enrollment.boardedAt,
          day,
          workoutSessions,
          isRest: isRestDay(day, workoutSessions),
        });
      }
    }
  }

  return scheduled.sort((a, b) => a.date.getTime() - b.date.getTime());
};
