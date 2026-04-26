import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  type AthleteDailySummary,
  type ProgressBuckets,
  ADHERENCE_IMPROVING_THRESHOLD,
  ADHERENCE_ON_TRACK_THRESHOLD,
  ProcessStatus,
  TodayStatus,
} from "@repo/contracts/coaching/coach-dashboard";

import { HEALTH_STATUS_MAP } from "../../mappers/coaching";
import { createStartOfDayCache, startOfWeekInTz } from "../../utils/date-helpers";

import type { AssignedAthleteWithData } from "./assigned-athlete-query";

type TodayStatusResult = {
  status: TodayStatus;
  missedCount: number;
  currentWorkoutTitle: string | null;
  lastActivityDate: Date | null;
};

export type TodayStatusContext = {
  tz: string;
  today: Date;
  weekStart: Date;
  startOfDay: (date: Date) => Date;
};

export const createTodayStatusContext = (tz: string): TodayStatusContext => {
  const startOfDay = createStartOfDayCache(tz);
  const today = startOfDay(new Date());
  const weekStart = startOfWeekInTz(today, tz);

  return { tz, today, weekStart, startOfDay };
};

export const computeTodayStatus = (hasActiveEnrollment: boolean): TodayStatusResult => ({
  status: hasActiveEnrollment ? TodayStatus.NO_SCHEDULE : TodayStatus.NO_SCHEDULE,
  missedCount: 0,
  currentWorkoutTitle: null,
  lastActivityDate: null,
});

export const computeAthletesSummary = (
  assignments: AssignedAthleteWithData[],
): AthleteDailySummary[] => {
  const summaries: AthleteDailySummary[] = [];

  for (const a of assignments) {
    const athlete = a.athlete;
    const healthStatus = athlete.athleteProfile
      ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY;

    if (athlete.planEnrollments.length === 0) {
      summaries.push({
        userId: athlete.id,
        name: athlete.name,
        email: athlete.email,
        image: athlete.image,
        planId: null,
        planName: null,
        todayStatus: TodayStatus.NO_SCHEDULE,
        missedCount: 0,
        todayWorkoutTitle: null,
        lastActivityDate: null,
        daysSinceLastActivity: null,
        healthStatus,
      });
      continue;
    }

    const firstEnrollment = athlete.planEnrollments[0];

    if (!firstEnrollment) {
      continue;
    }

    summaries.push({
      userId: athlete.id,
      name: athlete.name,
      email: athlete.email,
      image: athlete.image,
      planId: firstEnrollment.plan.id,
      planName: firstEnrollment.plan.name,
      todayStatus: TodayStatus.NO_SCHEDULE,
      missedCount: 0,
      todayWorkoutTitle: null,
      lastActivityDate: null,
      daysSinceLastActivity: null,
      healthStatus,
    });
  }

  return summaries;
};

export type AdherenceWindow = { completed: number; available: number };

export const computeAdherenceWindow = (
  _scheduledWorkouts: { id: string; scheduledDate: Date | null }[],
  _loggedWorkoutIds: Set<string>,
  _windowStart: Date,
  _windowEnd: Date,
): AdherenceWindow => ({ completed: 0, available: 0 });

export const computeProcessStatus = (
  currentAdherence: number,
  previousAdherence: number,
): ProcessStatus => {
  const delta = currentAdherence - previousAdherence;

  if (delta > ADHERENCE_IMPROVING_THRESHOLD) {
    return ProcessStatus.ON_TRACK;
  }

  if (delta < -ADHERENCE_IMPROVING_THRESHOLD) {
    return ProcessStatus.FALLING_BEHIND;
  }

  return currentAdherence >= ADHERENCE_ON_TRACK_THRESHOLD
    ? ProcessStatus.ON_TRACK
    : ProcessStatus.STEADY;
};

export const computeProgressBuckets = (
  _assignments: AssignedAthleteWithData[],
): ProgressBuckets => ({
  onTrack: [],
  steady: [],
  fallingBehind: [],
  avgEngagementRate: 0,
});
