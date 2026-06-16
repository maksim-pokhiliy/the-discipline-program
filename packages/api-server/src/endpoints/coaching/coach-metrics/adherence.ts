import {
  ADHERENCE_ON_TRACK_BUCKET,
  ADHERENCE_STEADY_BUCKET,
  ProcessStatus,
} from "@repo/contracts/coaching/coach-dashboard";

import { type PerformedByKey } from "./coach-metrics.types";
import { isSessionCompleted, type ScheduledDay } from "./scheduled-day";

const PERCENT_SCALE = 100;

type SessionTally = { planned: number; completed: number };

export const tallyWorkoutSessions = (
  scheduledDays: ScheduledDay[],
  performedByKey: PerformedByKey,
  athleteId: string,
): SessionTally => {
  let planned = 0;
  let completed = 0;

  for (const scheduled of scheduledDays) {
    for (const session of scheduled.workoutSessions) {
      planned += 1;

      if (isSessionCompleted(performedByKey, athleteId, session.id)) {
        completed += 1;
      }
    }
  }

  return { planned, completed };
};

export const ratioOf = ({ planned, completed }: SessionTally): number =>
  planned === 0 ? 0 : completed / planned;

export const toPercent = (ratio: number): number => Math.round(ratio * PERCENT_SCALE);

export const bucketProcessStatus = (adherenceRate: number): ProcessStatus => {
  if (adherenceRate >= ADHERENCE_ON_TRACK_BUCKET) {
    return ProcessStatus.ON_TRACK;
  }

  if (adherenceRate >= ADHERENCE_STEADY_BUCKET) {
    return ProcessStatus.STEADY;
  }

  return ProcessStatus.FALLING_BEHIND;
};

export const computeWeeklyDelta = (
  thisWeek: SessionTally,
  lastWeek: SessionTally,
): number | null => {
  if (lastWeek.planned === 0) {
    return null;
  }

  return toPercent(ratioOf(thisWeek)) - toPercent(ratioOf(lastWeek));
};
