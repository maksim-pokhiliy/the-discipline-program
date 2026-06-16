import { daysBetweenInTz } from "../../../utils/date-helpers";

import { buildPerformedKey, type PerformedByKey } from "./coach-metrics.types";
import { type ScheduledDay } from "./scheduled-day";

export const computeLastActivity = (
  scheduledDays: ScheduledDay[],
  performedByKey: PerformedByKey,
  athleteId: string,
  now: Date,
  tz: string,
): { lastActivityDate: Date | null; daysSinceLastActivity: number | null } => {
  let lastActivityDate: Date | null = null;

  for (const scheduled of scheduledDays) {
    for (const session of scheduled.workoutSessions) {
      const entry = performedByKey.get(buildPerformedKey(athleteId, session.id));

      if (!entry) {
        continue;
      }

      const activeAt = entry.completedAt ?? entry.startedAt;

      if (!lastActivityDate || activeAt > lastActivityDate) {
        lastActivityDate = activeAt;
      }
    }
  }

  const daysSinceLastActivity =
    lastActivityDate === null ? null : daysBetweenInTz(lastActivityDate, now, tz);

  return { lastActivityDate, daysSinceLastActivity };
};
