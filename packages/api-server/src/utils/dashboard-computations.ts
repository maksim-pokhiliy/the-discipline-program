import {
  type AthleteDailySummary,
  type LoadDistributionItem,
  type ProgressAthlete,
  type ProgressBuckets,
  type TodayStatus,
  LOW_COMPLETION_RATE,
} from "@repo/contracts/coach-dashboard";

import { daysBetween, startOfToday } from "./date-helpers";
import type { EnrollmentWithData } from "./enrollment-query";

export type { EnrollmentWithData };

type TodayStatusResult = {
  status: TodayStatus;
  currentWorkoutId: string | null;
  lastActivityDate: Date | null;
};

export const computeTodayStatus = (
  workouts: { id: string; dayOrder: number }[],
  logs: { workoutId: string; date: Date }[],
): TodayStatusResult => {
  if (workouts.length === 0) {
    return { status: "NO_PLAN", currentWorkoutId: null, lastActivityDate: null };
  }

  const sortedWorkouts = [...workouts].sort((a, b) => a.dayOrder - b.dayOrder);
  const loggedWorkoutIds = new Set(logs.map((l) => l.workoutId));
  const today = startOfToday();

  const lastLog =
    logs.length > 0 ? logs.reduce((latest, l) => (l.date > latest.date ? l : latest)) : null;

  const currentWorkout = sortedWorkouts.find((w) => !loggedWorkoutIds.has(w.id)) ?? null;

  if (!currentWorkout) {
    return {
      status: "COMPLETED",
      currentWorkoutId: null,
      lastActivityDate: lastLog?.date ?? null,
    };
  }

  if (lastLog) {
    const logDate = new Date(lastLog.date);

    logDate.setHours(0, 0, 0, 0);

    if (logDate.getTime() === today.getTime()) {
      return {
        status: "COMPLETED",
        currentWorkoutId: currentWorkout.id,
        lastActivityDate: lastLog.date,
      };
    }

    const daysSince = daysBetween(logDate, today);

    if (daysSince <= 1) {
      return {
        status: "PENDING",
        currentWorkoutId: currentWorkout.id,
        lastActivityDate: lastLog.date,
      };
    }

    return {
      status: "MISSED",
      currentWorkoutId: currentWorkout.id,
      lastActivityDate: lastLog.date,
    };
  }

  return {
    status: "PENDING",
    currentWorkoutId: currentWorkout.id,
    lastActivityDate: null,
  };
};

export const computeAthletesSummary = (
  enrollments: EnrollmentWithData[],
): AthleteDailySummary[] => {
  const athleteMap = new Map<string, AthleteDailySummary>();

  for (const e of enrollments) {
    const user = e.user;
    const { status, currentWorkoutId, lastActivityDate } = computeTodayStatus(
      e.trainingPlan.workouts,
      user.workoutLogs,
    );

    const today = startOfToday();
    const daysSinceLastActivity = lastActivityDate
      ? daysBetween(new Date(lastActivityDate), today)
      : null;

    const currentWorkout = currentWorkoutId
      ? e.trainingPlan.workouts.find((w) => w.id === currentWorkoutId)
      : null;

    const existing = athleteMap.get(user.id);

    if (!existing || status === "COMPLETED") {
      athleteMap.set(user.id, {
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        planId: e.trainingPlan.id,
        planName: e.trainingPlan.name,
        todayStatus: status,
        todayWorkoutTitle: currentWorkout?.title ?? null,
        lastActivityDate,
        daysSinceLastActivity,
        healthStatus: user.athleteProfile?.healthStatus ?? "HEALTHY",
      });
    }
  }

  return Array.from(athleteMap.values());
};

export const computeLoadDistribution = (
  enrollments: EnrollmentWithData[],
): LoadDistributionItem[] => {
  const categoryMap = new Map<string, { name: string; athletes: Set<string> }>();

  for (const e of enrollments) {
    const { currentWorkoutId } = computeTodayStatus(e.trainingPlan.workouts, e.user.workoutLogs);

    const currentWorkout = currentWorkoutId
      ? e.trainingPlan.workouts.find((w) => w.id === currentWorkoutId)
      : null;

    if (currentWorkout) {
      for (const block of currentWorkout.blocks) {
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
  let totalRate = 0;

  for (const [userId, data] of athleteData) {
    const rate = data.totalWorkouts > 0 ? data.completedWorkouts / data.totalWorkouts : 0;

    totalRate += rate;

    const entry: ProgressAthlete = {
      userId,
      name: data.name,
      image: data.image,
      completionRate: rate,
      trend: rate >= 0.7 ? "UP" : rate < LOW_COMPLETION_RATE ? "DOWN" : "STABLE",
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
    avgCompletionRate: totalAthletes > 0 ? totalRate / totalAthletes : 0,
    avgEngagementRate: totalAthletes > 0 ? activeAthletes / totalAthletes : 0,
  };
};
