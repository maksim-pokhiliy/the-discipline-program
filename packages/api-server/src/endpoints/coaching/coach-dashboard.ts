import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemStatus,
  SEVERITY_PRIORITY,
  TYPE_PRIORITY,
} from "@repo/contracts/coaching/coach-action-item";
import {
  type AthleteDailySummary,
  type CoachDashboardData,
  type DashboardActionItem,
  type ProgressAthlete,
  type ProgressBuckets,
  ProcessStatus,
  TodayStatus,
} from "@repo/contracts/coaching/coach-dashboard";
import { UserRole } from "@repo/contracts/iam/auth";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { prisma } from "../../db/client";
import { inMemoryCache } from "../../infrastructure/cache";
import {
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_MAP,
  HEALTH_STATUS_MAP,
} from "../../mappers/coaching";
import { ROLE_MAP } from "../../mappers/iam";
import { TRAINING_PLAN_STATUS_TO_PRISMA_MAP } from "../../mappers/lms";
import { findOrThrow } from "../../utils";
import {
  createStartOfDayCache,
  DAYS_IN_WEEK,
  MS_PER_DAY,
  startOfTodayInTz,
  startOfWeekInTz,
} from "../../utils/date-helpers";

import {
  buildAssignedAthleteInclude,
  type AssignedAthleteWithData,
} from "./assigned-athlete-query";
import { buildCoachMetricsCacheKey, coachingCoachActionItemApi } from "./coach-action-item";
import {
  type AthleteMetricsResult,
  computeAthleteMetrics,
  loadScheduleWindow,
  METRICS_CACHE_TTL_SECONDS,
  type WindowedEnrollment,
} from "./coach-metrics";

type ScheduleSummaryFields = Omit<
  AthleteDailySummary,
  "userId" | "name" | "email" | "image" | "healthStatus"
>;

type WorkoutCounts = Pick<
  CoachDashboardData["overview"],
  | "workoutsPlannedToday"
  | "workoutsCompletedToday"
  | "workoutsPlannedThisWeek"
  | "workoutsCompletedThisWeek"
>;

type MetricsSlice = {
  summaryByAthlete: Map<string, ScheduleSummaryFields>;
  workoutCounts: WorkoutCounts;
  progressBuckets: ProgressBuckets;
};

const EMPTY_WORKOUT_COUNTS: WorkoutCounts = {
  workoutsPlannedToday: 0,
  workoutsCompletedToday: 0,
  workoutsPlannedThisWeek: 0,
  workoutsCompletedThisWeek: 0,
};

const EMPTY_SCHEDULE_SUMMARY: ScheduleSummaryFields = {
  planId: null,
  planName: null,
  todayStatus: TodayStatus.NO_SCHEDULE,
  missedCount: 0,
  todayWorkoutTitle: null,
  lastActivityDate: null,
  daysSinceLastActivity: null,
};

const weekCoversToday = (weekStart: Date, startOfToday: Date): boolean => {
  const weekEnd = weekStart.getTime() + DAYS_IN_WEEK * MS_PER_DAY;

  return startOfToday.getTime() >= weekStart.getTime() && startOfToday.getTime() < weekEnd;
};

const pickPrimaryEnrollment = (
  enrollments: WindowedEnrollment[],
  startOfToday: Date,
  startOfDayCache: (date: Date) => Date,
): WindowedEnrollment | null => {
  const covering = enrollments.find((enrollment) =>
    enrollment.plan.weeks.some((week) =>
      weekCoversToday(startOfDayCache(week.startDate), startOfToday),
    ),
  );

  if (covering) {
    return covering;
  }

  return enrollments.reduce<WindowedEnrollment | null>((latest, enrollment) => {
    if (!latest || enrollment.boardedAt > latest.boardedAt) {
      return enrollment;
    }

    return latest;
  }, null);
};

const toScheduleSummary = (
  metrics: AthleteMetricsResult,
  primary: WindowedEnrollment | null,
): ScheduleSummaryFields => ({
  planId: primary?.planId ?? null,
  planName: primary?.plan.name ?? null,
  todayStatus: metrics.todayStatus,
  missedCount: metrics.missedCount,
  todayWorkoutTitle: metrics.todayWorkoutTitle,
  lastActivityDate: metrics.lastActivityDate,
  daysSinceLastActivity: metrics.daysSinceLastActivity,
});

const toProgressAthlete = (
  athlete: AssignedAthleteWithData["athlete"],
  metrics: AthleteMetricsResult,
  isFallingBehind: boolean,
): ProgressAthlete => ({
  userId: athlete.id,
  name: athlete.name,
  image: athlete.image,
  processStatus: metrics.processStatus,
  engagementPct: isFallingBehind ? metrics.engagementPct : null,
  weeklyDelta: isFallingBehind ? metrics.weeklyDelta : null,
});

const accumulateWorkoutCounts = (counts: WorkoutCounts, metrics: AthleteMetricsResult): void => {
  for (const plan of metrics.planDiscipline) {
    counts.workoutsPlannedThisWeek += plan.planned;
    counts.workoutsCompletedThisWeek += plan.completed;
  }

  if (
    metrics.todayStatus === TodayStatus.COMPLETED ||
    metrics.todayStatus === TodayStatus.PENDING
  ) {
    counts.workoutsPlannedToday += 1;
  }

  if (metrics.todayStatus === TodayStatus.COMPLETED) {
    counts.workoutsCompletedToday += 1;
  }
};

const computeMetricsSlice = async (
  assignments: AssignedAthleteWithData[],
  tz: string,
): Promise<MetricsSlice> => {
  const summaryByAthlete = new Map<string, ScheduleSummaryFields>();
  const buckets: Record<ProcessStatus, ProgressAthlete[]> = {
    [ProcessStatus.ON_TRACK]: [],
    [ProcessStatus.STEADY]: [],
    [ProcessStatus.FALLING_BEHIND]: [],
  };
  const workoutCounts: WorkoutCounts = { ...EMPTY_WORKOUT_COUNTS };

  const now = new Date();
  const athleteIds = assignments.map((a) => a.athlete.id);
  const { enrollmentsByAthlete, performedByKey, weekCountByPlan, firstWeekStartByPlan } =
    await loadScheduleWindow({ athleteIds, tz, now });
  const startOfDayCache = createStartOfDayCache(tz);
  const startOfToday = startOfDayCache(now);

  let adherenceSum = 0;

  for (const assignment of assignments) {
    const athlete = assignment.athlete;
    const enrollments = enrollmentsByAthlete.get(athlete.id) ?? [];
    const metrics = computeAthleteMetrics({
      athleteId: athlete.id,
      enrollments,
      performedByKey,
      weekCountByPlan,
      firstWeekStartByPlan,
      tz,
      now,
      startOfDayCache,
    });
    const primary = pickPrimaryEnrollment(enrollments, startOfToday, startOfDayCache);

    summaryByAthlete.set(athlete.id, toScheduleSummary(metrics, primary));

    const isFallingBehind = metrics.processStatus === ProcessStatus.FALLING_BEHIND;

    buckets[metrics.processStatus].push(toProgressAthlete(athlete, metrics, isFallingBehind));
    adherenceSum += metrics.adherenceRate;
    accumulateWorkoutCounts(workoutCounts, metrics);
  }

  const avgEngagementRate = assignments.length === 0 ? 0 : adherenceSum / assignments.length;

  return {
    summaryByAthlete,
    workoutCounts,
    progressBuckets: {
      onTrack: buckets[ProcessStatus.ON_TRACK],
      steady: buckets[ProcessStatus.STEADY],
      fallingBehind: buckets[ProcessStatus.FALLING_BEHIND],
      avgEngagementRate,
    },
  };
};

const resolveMetricsSlice = async (
  coachId: string,
  assignments: AssignedAthleteWithData[],
  tz: string,
): Promise<MetricsSlice> => {
  const cacheKey = buildCoachMetricsCacheKey(coachId);
  const cached = await inMemoryCache.get<MetricsSlice>(cacheKey);

  if (cached) {
    return cached;
  }

  const slice = await computeMetricsSlice(assignments, tz);

  await inMemoryCache.set(cacheKey, slice, { ttlSeconds: METRICS_CACHE_TTL_SECONDS });

  return slice;
};

const buildAthletesSummary = (
  assignments: AssignedAthleteWithData[],
  summaryByAthlete: Map<string, ScheduleSummaryFields>,
): AthleteDailySummary[] =>
  assignments.map((assignment) => {
    const athlete = assignment.athlete;
    const healthStatus = athlete.athleteProfile
      ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY;
    const schedule = summaryByAthlete.get(athlete.id) ?? EMPTY_SCHEDULE_SUMMARY;

    return {
      userId: athlete.id,
      name: athlete.name,
      email: athlete.email,
      image: athlete.image,
      healthStatus,
      ...schedule,
    };
  });

export const coachingCoachDashboardApi = {
  getDashboard: async (userId: string): Promise<CoachDashboardData> => {
    const { coachId } = await coachingCoachActionItemApi.reconcile(userId);

    const user = await findOrThrow(
      prisma.user.findUnique({ where: { id: userId }, select: { timezone: true, role: true } }),
      "User",
    );

    const tz = user.timezone ?? "UTC";
    const weekStart = startOfWeekInTz(startOfTodayInTz(tz), tz);

    const role = ROLE_MAP[user.role];
    const isAdminLike = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

    const planFilter = isAdminLike ? { deletedAt: null } : { deletedAt: null, creatorId: userId };

    const [assignments, openActionItems, activePlansCount] = await Promise.all([
      prisma.coachAthleteAssignment.findMany({
        where: { coachId },
        include: buildAssignedAthleteInclude(userId),
      }),

      prisma.coachActionItem.findMany({
        where: { coachId, status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.OPEN] },
        include: {
          athlete: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.trainingPlan.count({
        where: {
          ...planFilter,
          status: TRAINING_PLAN_STATUS_TO_PRISMA_MAP[TrainingPlanStatus.ACTIVE],
        },
      }),
    ]);

    const recentAthletes = new Set<string>();

    for (const a of assignments) {
      if (a.createdAt >= weekStart) {
        recentAthletes.add(a.athlete.id);
      }
    }

    const { summaryByAthlete, workoutCounts, progressBuckets } = await resolveMetricsSlice(
      coachId,
      assignments,
      tz,
    );

    const actionItems: DashboardActionItem[] = openActionItems
      .map((item) => ({
        id: item.id,
        type: ACTION_ITEM_TYPE_MAP[item.type],
        severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
        athleteId: item.athleteId,
        athleteName: item.athlete.name,
        athleteImage: item.athlete.image,
        message: item.message,
        createdAt: item.createdAt,
      }))
      .sort(
        (a, b) =>
          TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type] ||
          SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity],
      );

    return {
      overview: {
        totalActiveAthletes: assignments.length,
        activePlansCount,
        openActionItemsCount: openActionItems.length,
        newAthletesCount: recentAthletes.size,
        ...workoutCounts,
      },
      actionItems,
      athletesSummary: buildAthletesSummary(assignments, summaryByAthlete),
      progressBuckets,
    };
  },
};
