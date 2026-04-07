import { HealthStatus } from "@repo/contracts/athlete-profile";
import {
  type AthleteDailySummary,
  type ProgressAthlete,
  type ProgressBuckets,
  ADHERENCE_IMPROVING_THRESHOLD,
  ProcessStatus,
  TodayStatus,
} from "@repo/contracts/coach-dashboard";

import { HEALTH_STATUS_MAP } from "../mappers/enum-maps";

import {
  daysBetweenInTz,
  MS_PER_DAY,
  startOfDayInTz,
  startOfTodayInTz,
  startOfWeekInTz,
} from "./date-helpers";
import type { EnrollmentWithData } from "./enrollment-query";

export type { EnrollmentWithData };

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

export const computeTodayStatus = (
  workouts: { id: string; scheduledDate: Date | null; createdAt: Date; title: string }[],
  logs: { workoutId: string; date: Date }[],
  tz: string,
): TodayStatusResult => {
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

  const today = startOfTodayInTz(tz);
  const weekStart = startOfWeekInTz(today, tz);
  const loggedWorkoutIds = new Set(logs.map((l) => l.workoutId));

  const todayWorkouts = scheduledWorkouts.filter(
    (w) => startOfDayInTz(w.scheduledDate, tz).getTime() === today.getTime(),
  );

  const pastWorkoutsThisWeek = scheduledWorkouts
    .filter((w) => {
      const d = startOfDayInTz(w.scheduledDate, tz);

      return d.getTime() >= weekStart.getTime() && d.getTime() < today.getTime();
    })
    .filter(
      (w) =>
        startOfDayInTz(w.createdAt, tz).getTime() <= startOfDayInTz(w.scheduledDate, tz).getTime(),
    )
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
  enrollments: EnrollmentWithData[],
  tz: string,
): AthleteDailySummary[] => {
  const athleteMap = new Map<string, AthleteDailySummary>();
  const today = startOfTodayInTz(tz);

  for (const e of enrollments) {
    const user = e.user;
    const { status, missedCount, currentWorkoutTitle, lastActivityDate } = computeTodayStatus(
      e.trainingPlan.workouts,
      user.workoutLogs,
      tz,
    );

    const daysSinceLastActivity = lastActivityDate
      ? daysBetweenInTz(new Date(lastActivityDate), today, tz)
      : null;

    const existing = athleteMap.get(user.id);
    const isHigherPriority =
      !existing || STATUS_PRIORITY[status] < STATUS_PRIORITY[existing.todayStatus];

    if (isHigherPriority) {
      athleteMap.set(user.id, {
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        planId: e.trainingPlan.id,
        planName: e.trainingPlan.name,
        todayStatus: status,
        missedCount,
        todayWorkoutTitle: currentWorkoutTitle,
        lastActivityDate,
        daysSinceLastActivity,
        healthStatus: user.athleteProfile
          ? HEALTH_STATUS_MAP[user.athleteProfile.healthStatus]
          : HealthStatus.HEALTHY,
      });
    } else if (existing && missedCount > existing.missedCount) {
      existing.missedCount = missedCount;
    }
  }

  return Array.from(athleteMap.values());
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

  return currentAdherence >= 0.7 ? ProcessStatus.ON_TRACK : ProcessStatus.STEADY;
};

export const computeProgressBuckets = (enrollments: EnrollmentWithData[]): ProgressBuckets => {
  const now = new Date();
  const currentEnd = now;
  const currentStart = new Date(now.getTime() - 7 * MS_PER_DAY);
  const previousStart = new Date(now.getTime() - 14 * MS_PER_DAY);

  const athleteData = new Map<
    string,
    {
      name: string | null;
      image: string | null;
      current: AdherenceWindow;
      previous: AdherenceWindow;
      hasLogs: boolean;
    }
  >();

  for (const e of enrollments) {
    const user = e.user;
    const loggedIds = new Set(user.workoutLogs.map((l) => l.workoutId));
    const workouts = e.trainingPlan.workouts;

    const curWindow = computeAdherenceWindow(workouts, loggedIds, currentStart, currentEnd);
    const prevWindow = computeAdherenceWindow(workouts, loggedIds, previousStart, currentStart);

    const existing = athleteData.get(user.id);

    if (existing) {
      existing.current.completed += curWindow.completed;
      existing.current.available += curWindow.available;
      existing.previous.completed += prevWindow.completed;
      existing.previous.available += prevWindow.available;
      existing.hasLogs = existing.hasLogs || user.workoutLogs.length > 0;
    } else {
      athleteData.set(user.id, {
        name: user.name,
        image: user.image,
        current: { ...curWindow },
        previous: { ...prevWindow },
        hasLogs: user.workoutLogs.length > 0,
      });
    }
  }

  const onTrack: ProgressAthlete[] = [];
  const steady: ProgressAthlete[] = [];
  const fallingBehind: ProgressAthlete[] = [];

  for (const [userId, data] of athleteData) {
    const curRate =
      data.current.available > 0 ? data.current.completed / data.current.available : 0;
    const prevRate =
      data.previous.available > 0 ? data.previous.completed / data.previous.available : 0;

    const status = computeProcessStatus(curRate, prevRate);
    const entry: ProgressAthlete = {
      userId,
      name: data.name,
      image: data.image,
      processStatus: status,
      href: `/coach/athletes?athlete=${userId}`,
    };

    if (status === ProcessStatus.ON_TRACK) {
      onTrack.push(entry);
    } else if (status === ProcessStatus.FALLING_BEHIND) {
      fallingBehind.push(entry);
    } else {
      steady.push(entry);
    }
  }

  const totalAthletes = athleteData.size;
  const activeAthletes = Array.from(athleteData.values()).filter((d) => d.hasLogs).length;

  return {
    onTrack,
    steady,
    fallingBehind,
    avgEngagementRate: totalAthletes > 0 ? activeAthletes / totalAthletes : 0,
  };
};
