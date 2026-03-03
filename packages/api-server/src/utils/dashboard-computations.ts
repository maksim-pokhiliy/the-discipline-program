import { HealthStatus } from "@repo/contracts/athlete-profile";
import {
  type AthleteDailySummary,
  type LoadDistributionItem,
  type ProgressAthlete,
  type ProgressBuckets,
  LOW_COMPLETION_RATE,
  ProgressTrend,
  TodayStatus,
} from "@repo/contracts/coach-dashboard";

import { daysBetween, startOfDay, startOfToday, startOfWeek } from "./date-helpers";
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
): TodayStatusResult => {
  const noResult: TodayStatusResult = {
    status: TodayStatus.NO_PLAN,
    missedCount: 0,
    currentWorkoutTitle: null,
    lastActivityDate: null,
  };

  if (workouts.length === 0) {
    return noResult;
  }

  const today = startOfToday();
  const weekStart = startOfWeek(today);
  const loggedWorkoutIds = new Set(logs.map((l) => l.workoutId));
  const lastLog =
    logs.length > 0 ? logs.reduce((latest, l) => (l.date > latest.date ? l : latest)) : null;
  const lastActivityDate = lastLog?.date ?? null;

  const scheduledWorkouts = workouts
    .filter(hasScheduledDate)
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  if (scheduledWorkouts.length === 0) {
    return noResult;
  }

  const todayWorkouts = scheduledWorkouts.filter(
    (w) => startOfDay(w.scheduledDate).getTime() === today.getTime(),
  );

  const todayAllDone =
    todayWorkouts.length > 0 && todayWorkouts.every((w) => loggedWorkoutIds.has(w.id));

  const currentTodayWorkout = todayWorkouts.find((w) => !loggedWorkoutIds.has(w.id));

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

  if (todayAllDone) {
    return {
      status: TodayStatus.COMPLETED,
      missedCount,
      currentWorkoutTitle: null,
      lastActivityDate,
    };
  }

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
    status: TodayStatus.COMPLETED,
    missedCount: 0,
    currentWorkoutTitle: null,
    lastActivityDate,
  };
};

export const computeAthletesSummary = (
  enrollments: EnrollmentWithData[],
): AthleteDailySummary[] => {
  const athleteMap = new Map<string, AthleteDailySummary>();

  for (const e of enrollments) {
    const user = e.user;
    const { status, missedCount, currentWorkoutTitle, lastActivityDate } = computeTodayStatus(
      e.trainingPlan.workouts,
      user.workoutLogs,
    );

    const today = startOfToday();
    const daysSinceLastActivity = lastActivityDate
      ? daysBetween(new Date(lastActivityDate), today)
      : null;

    const existing = athleteMap.get(user.id);

    if (!existing || status === TodayStatus.COMPLETED) {
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
        healthStatus: (user.athleteProfile?.healthStatus as HealthStatus) ?? HealthStatus.HEALTHY,
      });
    }
  }

  return Array.from(athleteMap.values());
};

export const computeLoadDistribution = (
  enrollments: EnrollmentWithData[],
): LoadDistributionItem[] => {
  const categoryMap = new Map<string, { name: string; athletes: Set<string> }>();
  const today = startOfToday();

  for (const e of enrollments) {
    const todayWorkouts = e.trainingPlan.workouts.filter(
      (w) => w.scheduledDate && startOfDay(w.scheduledDate).getTime() === today.getTime(),
    );

    for (const workout of todayWorkouts) {
      for (const block of workout.blocks) {
        const cat = block.category;
        const entry = categoryMap.get(cat.id) ?? { name: cat.name, athletes: new Set<string>() };

        entry.athletes.add(e.user.id);
        categoryMap.set(cat.id, entry);
      }
    }
  }

  const totalAthletes = new Set(enrollments.map((e) => e.user.id)).size;

  return Array.from(categoryMap.entries())
    .map(([categoryId, { name, athletes }]) => ({
      categoryId,
      categoryName: name,
      athleteCount: athletes.size,
      percentage: totalAthletes > 0 ? athletes.size / totalAthletes : 0,
    }))
    .sort((a, b) => b.athleteCount - a.athleteCount);
};

export const computeProgressBuckets = (enrollments: EnrollmentWithData[]): ProgressBuckets => {
  const athleteData = new Map<
    string,
    {
      name: string | null;
      image: string | null;
      totalWorkouts: number;
      completedWorkouts: number;
    }
  >();

  for (const e of enrollments) {
    const user = e.user;
    const existing = athleteData.get(user.id);
    const planWorkoutsCount = e.trainingPlan.workouts.length;
    const completedCount = user.workoutLogs.filter((l) =>
      e.trainingPlan.workouts.some((w) => w.id === l.workoutId),
    ).length;

    if (existing) {
      existing.totalWorkouts += planWorkoutsCount;
      existing.completedWorkouts += completedCount;
    } else {
      athleteData.set(user.id, {
        name: user.name,
        image: user.image,
        totalWorkouts: planWorkoutsCount,
        completedWorkouts: completedCount,
      });
    }
  }

  const improving: ProgressAthlete[] = [];
  const stagnating: ProgressAthlete[] = [];
  const declining: ProgressAthlete[] = [];

  for (const [userId, data] of athleteData) {
    const rate = data.totalWorkouts > 0 ? data.completedWorkouts / data.totalWorkouts : 0;
    const entry: ProgressAthlete = {
      userId,
      name: data.name,
      image: data.image,
      completionRate: rate,
      trend:
        rate >= 0.7
          ? ProgressTrend.UP
          : rate < LOW_COMPLETION_RATE
            ? ProgressTrend.DOWN
            : ProgressTrend.STABLE,
      href: `/coach/athletes/${userId}`,
    };

    if (entry.trend === "UP") {
      improving.push(entry);
    } else if (entry.trend === "DOWN") {
      declining.push(entry);
    } else {
      stagnating.push(entry);
    }
  }

  const totalAthletes = athleteData.size;
  const activeAthletes = Array.from(athleteData.values()).filter(
    (d) => d.completedWorkouts > 0,
  ).length;

  return {
    improving,
    stagnating,
    declining,
    avgEngagementRate: totalAthletes > 0 ? activeAthletes / totalAthletes : 0,
  };
};
