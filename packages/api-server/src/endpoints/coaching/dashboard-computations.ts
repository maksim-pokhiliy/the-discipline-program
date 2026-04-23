import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  type AthleteDailySummary,
  type ProgressAthlete,
  type ProgressBuckets,
  ADHERENCE_IMPROVING_THRESHOLD,
  ADHERENCE_ON_TRACK_THRESHOLD,
  ProcessStatus,
  TodayStatus,
} from "@repo/contracts/coaching/coach-dashboard";

import { HEALTH_STATUS_MAP } from "../../mappers/coaching";
import {
  createStartOfDayCache,
  DAYS_IN_WEEK,
  daysBetweenInTz,
  MS_PER_DAY,
  startOfWeekInTz,
  TWO_WEEKS,
} from "../../utils/date-helpers";

import type { AssignedAthleteWithData } from "./assigned-athlete-query";

type TodayStatusResult = {
  status: TodayStatus;
  missedCount: number;
  currentWorkoutTitle: string | null;
  lastActivityDate: Date | null;
};

type ScheduledWorkout = { id: string; scheduledDate: Date; createdAt: Date; title: string };

const hasScheduledDate = (w: {
  id: string;
  scheduledDate: Date | null;
  createdAt: Date;
  title: string;
}): w is ScheduledWorkout => w.scheduledDate !== null;

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

export const computeTodayStatus = (
  workouts: { id: string; scheduledDate: Date | null; createdAt: Date; title: string }[],
  logs: { workoutId: string; date: Date }[],
  ctxOrTz: TodayStatusContext | string,
): TodayStatusResult => {
  const ctx = typeof ctxOrTz === "string" ? createTodayStatusContext(ctxOrTz) : ctxOrTz;
  const lastLog =
    logs.length > 0 ? logs.reduce((latest, l) => (l.date > latest.date ? l : latest)) : null;
  const lastActivityDate = lastLog?.date ?? null;

  const scheduledWorkouts = workouts
    .filter(hasScheduledDate)
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  if (scheduledWorkouts.length === 0) {
    return {
      status: TodayStatus.NO_SCHEDULE,
      missedCount: 0,
      currentWorkoutTitle: null,
      lastActivityDate,
    };
  }

  const { today, weekStart, startOfDay } = ctx;
  const loggedWorkoutIds = new Set(logs.map((l) => l.workoutId));

  const todayWorkouts = scheduledWorkouts.filter(
    (w) => startOfDay(w.scheduledDate).getTime() === today.getTime(),
  );

  const pastWorkoutsThisWeek = scheduledWorkouts
    .filter((w) => {
      const d = startOfDay(w.scheduledDate);

      return d.getTime() >= weekStart.getTime() && d.getTime() < today.getTime();
    })
    .filter((w) => startOfDay(w.createdAt).getTime() <= startOfDay(w.scheduledDate).getTime())
    .sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());

  let missedCount = 0;

  for (const w of pastWorkoutsThisWeek) {
    if (loggedWorkoutIds.has(w.id)) {
      break;
    }

    missedCount++;
  }

  const todayAllDone =
    todayWorkouts.length > 0 && todayWorkouts.every((w) => loggedWorkoutIds.has(w.id));

  if (todayAllDone) {
    return {
      status: TodayStatus.COMPLETED,
      missedCount,
      currentWorkoutTitle: null,
      lastActivityDate,
    };
  }

  const currentTodayWorkout = todayWorkouts.find((w) => !loggedWorkoutIds.has(w.id));

  if (todayWorkouts.length > 0) {
    return {
      status: TodayStatus.PENDING,
      missedCount,
      currentWorkoutTitle: currentTodayWorkout?.title ?? null,
      lastActivityDate,
    };
  }

  if (missedCount > 0) {
    return {
      status: TodayStatus.MISSED,
      missedCount,
      currentWorkoutTitle: null,
      lastActivityDate,
    };
  }

  return {
    status: TodayStatus.REST_DAY,
    missedCount: 0,
    currentWorkoutTitle: null,
    lastActivityDate,
  };
};

const STATUS_PRIORITY: Record<TodayStatus, number> = {
  [TodayStatus.MISSED]: 0,
  [TodayStatus.PENDING]: 1,
  [TodayStatus.COMPLETED]: 2,
  [TodayStatus.REST_DAY]: 3,
  [TodayStatus.NO_SCHEDULE]: 4,
};

export const computeAthletesSummary = (
  assignments: AssignedAthleteWithData[],
  tz: string,
): AthleteDailySummary[] => {
  const ctx = createTodayStatusContext(tz);
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

    let best: AthleteDailySummary | null = null;
    let highestMissed = 0;

    for (const e of athlete.planEnrollments) {
      const { status, missedCount, currentWorkoutTitle, lastActivityDate } = computeTodayStatus(
        e.trainingPlan.workouts,
        athlete.workoutLogs,
        ctx,
      );

      if (missedCount > highestMissed) {
        highestMissed = missedCount;
      }

      const daysSinceLastActivity = lastActivityDate
        ? daysBetweenInTz(new Date(lastActivityDate), ctx.today, tz)
        : null;

      const candidate: AthleteDailySummary = {
        userId: athlete.id,
        name: athlete.name,
        email: athlete.email,
        image: athlete.image,
        planId: e.trainingPlan.id,
        planName: e.trainingPlan.name,
        todayStatus: status,
        missedCount,
        todayWorkoutTitle: currentWorkoutTitle,
        lastActivityDate,
        daysSinceLastActivity,
        healthStatus,
      };

      if (!best || STATUS_PRIORITY[candidate.todayStatus] < STATUS_PRIORITY[best.todayStatus]) {
        best = candidate;
      }
    }

    if (!best) {
      continue;
    }

    if (highestMissed > best.missedCount) {
      best.missedCount = highestMissed;
    }

    summaries.push(best);
  }

  return summaries;
};

export type AdherenceWindow = { completed: number; available: number };

export const computeAdherenceWindow = (
  scheduledWorkouts: { id: string; scheduledDate: Date | null }[],
  loggedWorkoutIds: Set<string>,
  windowStart: Date,
  windowEnd: Date,
): AdherenceWindow => {
  let available = 0;
  let completed = 0;

  for (const w of scheduledWorkouts) {
    if (!w.scheduledDate) {
      continue;
    }

    const t = w.scheduledDate.getTime();

    if (t >= windowStart.getTime() && t < windowEnd.getTime()) {
      available++;

      if (loggedWorkoutIds.has(w.id)) {
        completed++;
      }
    }
  }

  return { completed, available };
};

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

export const computeProgressBuckets = (assignments: AssignedAthleteWithData[]): ProgressBuckets => {
  const now = new Date();
  const currentEnd = now;
  const currentStart = new Date(now.getTime() - DAYS_IN_WEEK * MS_PER_DAY);
  const previousStart = new Date(now.getTime() - TWO_WEEKS * MS_PER_DAY);

  const onTrack: ProgressAthlete[] = [];
  const steady: ProgressAthlete[] = [];
  const fallingBehind: ProgressAthlete[] = [];

  let totalAthletes = 0;
  let activeAthletes = 0;

  for (const a of assignments) {
    const athlete = a.athlete;
    const loggedIds = new Set(athlete.workoutLogs.map((l) => l.workoutId));
    const workouts = athlete.planEnrollments.flatMap((e) => e.trainingPlan.workouts);

    const curWindow = computeAdherenceWindow(workouts, loggedIds, currentStart, currentEnd);
    const prevWindow = computeAdherenceWindow(workouts, loggedIds, previousStart, currentStart);

    const curRate = curWindow.available > 0 ? curWindow.completed / curWindow.available : 0;
    const prevRate = prevWindow.available > 0 ? prevWindow.completed / prevWindow.available : 0;

    const status = computeProcessStatus(curRate, prevRate);
    const entry: ProgressAthlete = {
      userId: athlete.id,
      name: athlete.name,
      image: athlete.image,
      processStatus: status,
    };

    if (status === ProcessStatus.ON_TRACK) {
      onTrack.push(entry);
    } else if (status === ProcessStatus.FALLING_BEHIND) {
      fallingBehind.push(entry);
    } else {
      steady.push(entry);
    }

    totalAthletes++;

    if (athlete.workoutLogs.length > 0) {
      activeAthletes++;
    }
  }

  return {
    onTrack,
    steady,
    fallingBehind,
    avgEngagementRate: totalAthletes > 0 ? activeAthletes / totalAthletes : 0,
  };
};
