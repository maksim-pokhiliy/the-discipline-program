import {
  type AttentionAlert,
  type AthleteDailySummary,
  type AthleteFlagSummary,
  MISSED_DAYS_CRITICAL,
  MISSED_DAYS_WARNING,
  NEW_ATHLETE_THRESHOLD_DAYS,
  PLAN_ENDING_THRESHOLD_DAYS,
  LOW_COMPLETION_RATE,
} from "@repo/contracts/coach-dashboard";

type TodayStatus = "COMPLETED" | "PENDING" | "MISSED" | "NO_PLAN";

type EnrollmentWithData = {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  trainingPlan: {
    id: string;
    name: string;
    workouts: {
      id: string;
      dayOrder: number;
      title: string;
      blocks: { categoryId: string; category: { id: string; name: string } }[];
    }[];
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    workoutLogs: { id: string; workoutId: string; date: Date }[];
    athleteFlags: { id: string; type: string; note: string | null; createdAt: Date }[];
  };
};

const daysBetween = (a: Date, b: Date): number =>
  Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const startOfToday = (): Date => {
  const d = new Date();

  d.setHours(0, 0, 0, 0);

  return d;
};

export const computeTodayStatus = (
  workouts: { id: string; dayOrder: number }[],
  logs: { workoutId: string; date: Date }[],
): { status: TodayStatus; currentWorkoutId: string | null; lastActivityDate: Date | null } => {
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

    const flags: AthleteFlagSummary[] = user.athleteFlags.map((f) => ({
      id: f.id,
      type: f.type as AthleteFlagSummary["type"],
      note: f.note,
      createdAt: f.createdAt,
    }));

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
        activeFlags: flags,
      });
    }
  }

  return Array.from(athleteMap.values());
};

export const computeAttentionAlerts = (enrollments: EnrollmentWithData[]): AttentionAlert[] => {
  const alerts: AttentionAlert[] = [];
  const today = startOfToday();
  const processedAthletes = new Set<string>();

  for (const e of enrollments) {
    const user = e.user;
    const athleteKey = user.id;

    if (!processedAthletes.has(athleteKey)) {
      processedAthletes.add(athleteKey);

      const lastLog =
        user.workoutLogs.length > 0
          ? user.workoutLogs.reduce((latest, l) => (l.date > latest.date ? l : latest))
          : null;

      if (lastLog) {
        const daysSince = daysBetween(new Date(lastLog.date), today);

        if (daysSince >= MISSED_DAYS_WARNING) {
          alerts.push({
            type: "MISSED_WORKOUTS",
            severity: daysSince >= MISSED_DAYS_CRITICAL ? "CRITICAL" : "WARNING",
            athleteId: user.id,
            athleteName: user.name,
            message: `${daysSince} days without activity`,
            href: `/coach/athletes/${user.id}`,
          });
        }
      }

      const enrolledDays = daysBetween(e.startDate, today);

      if (enrolledDays <= NEW_ATHLETE_THRESHOLD_DAYS && user.workoutLogs.length === 0) {
        alerts.push({
          type: "NEW_NO_START",
          severity: "INFO",
          athleteId: user.id,
          athleteName: user.name,
          message: `Enrolled ${enrolledDays} day(s) ago, no workouts started`,
          href: `/coach/athletes/${user.id}`,
        });
      }

      for (const flag of user.athleteFlags) {
        if (flag.type === "INJURY" || flag.type === "RESTRICTION") {
          alerts.push({
            type: "OPEN_FLAG",
            severity: "CRITICAL",
            athleteId: user.id,
            athleteName: user.name,
            message: `Open ${flag.type.toLowerCase()} flag${flag.note ? `: ${flag.note}` : ""}`,
            href: `/coach/athletes/${user.id}`,
          });
        }
      }
    }

    if (e.endDate) {
      const daysLeft = daysBetween(today, new Date(e.endDate));

      if (daysLeft >= 0 && daysLeft <= PLAN_ENDING_THRESHOLD_DAYS) {
        alerts.push({
          type: "PLAN_ENDING",
          severity: daysLeft < 7 ? "WARNING" : "INFO",
          athleteId: user.id,
          athleteName: user.name,
          message: `"${e.trainingPlan.name}" ends in ${daysLeft} day(s)`,
          href: `/coach/athletes/${user.id}`,
        });
      }
    }
  }

  const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };

  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
};

export const computeLoadDistribution = (
  enrollments: EnrollmentWithData[],
): { categoryId: string; categoryName: string; athleteCount: number; percentage: number }[] => {
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

type ProgressEntry = {
  userId: string;
  name: string | null;
  image: string | null;
  completionRate: number;
  trend: "UP" | "DOWN" | "STABLE";
  href: string;
};

type ProgressBucketsResult = {
  improving: ProgressEntry[];
  stagnating: ProgressEntry[];
  declining: ProgressEntry[];
  avgCompletionRate: number;
  avgEngagementRate: number;
};

export const computeProgressBuckets = (
  enrollments: EnrollmentWithData[],
): ProgressBucketsResult => {
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

  const improving: ProgressEntry[] = [];
  const stagnating: ProgressEntry[] = [];
  const declining: ProgressEntry[] = [];
  let totalRate = 0;

  for (const [userId, data] of athleteData) {
    const rate = data.totalWorkouts > 0 ? data.completedWorkouts / data.totalWorkouts : 0;

    totalRate += rate;

    const entry: ProgressEntry = {
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
