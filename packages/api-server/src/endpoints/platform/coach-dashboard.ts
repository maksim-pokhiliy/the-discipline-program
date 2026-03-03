import { SEVERITY_PRIORITY } from "@repo/contracts/coach-action-item";
import {
  type CoachDashboardData,
  type DashboardActionItem,
  type DashboardNote,
  type OnboardingAthlete,
  NEW_ATHLETE_THRESHOLD_DAYS,
  TRAINED_THIS_WEEK_DAYS,
} from "@repo/contracts/coach-dashboard";

import { prisma } from "../../db/client";
import {
  computeAthletesSummary,
  computeLoadDistribution,
  computeProgressBuckets,
} from "../../utils/dashboard-computations";
import { enrollmentInclude } from "../../utils/enrollment-query";

import { platformCoachActionItemsApi } from "./coach-action-items";
import { resolveCoachId } from "./guards";

export const platformCoachDashboardApi = {
  getDashboard: async (userId: string): Promise<CoachDashboardData> => {
    await platformCoachActionItemsApi.reconcile(userId);

    const coachId = await resolveCoachId(userId);

    const now = new Date();
    const thresholdDate = new Date(now);

    thresholdDate.setDate(thresholdDate.getDate() - NEW_ATHLETE_THRESHOLD_DAYS);
    const weekAgo = new Date(now);

    weekAgo.setDate(weekAgo.getDate() - TRAINED_THIS_WEEK_DAYS);

    const [enrollments, openActionItems, recentNotesRaw, recentEnrollments] = await Promise.all([
      prisma.planEnrollment.findMany({
        where: {
          status: "ACTIVE",
          trainingPlan: { coachId, deletedAt: null },
        },
        include: enrollmentInclude,
      }),

      prisma.coachActionItem.findMany({
        where: { coachId, status: "OPEN" },
        include: {
          athlete: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.coachNote.findMany({
        where: { coachId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          athlete: { select: { id: true, name: true } },
        },
      }),

      prisma.planEnrollment.findMany({
        where: {
          status: "ACTIVE",
          startDate: { gte: thresholdDate },
          trainingPlan: { coachId, deletedAt: null },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              workoutLogs: {
                select: { id: true },
                take: 1,
              },
            },
          },
          trainingPlan: { select: { name: true } },
        },
      }),
    ]);

    const athletesSummary = computeAthletesSummary(enrollments);
    const loadDistributionToday = computeLoadDistribution(enrollments);
    const progressBuckets = computeProgressBuckets(enrollments);

    const uniqueAthletes = new Set(enrollments.map((e) => e.user.id));
    const completedToday = athletesSummary.filter((a) => a.todayStatus === "COMPLETED").length;

    const actionItems: DashboardActionItem[] = openActionItems
      .map((item) => ({
        id: item.id,
        type: item.type as DashboardActionItem["type"],
        severity: item.severity as DashboardActionItem["severity"],
        athleteId: item.athleteId,
        athleteName: item.athlete.name,
        athleteImage: item.athlete.image,
        message: item.message,
        href: `/coach/athletes/${item.athleteId}`,
        createdAt: item.createdAt,
      }))
      .sort((a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity]);

    const trainedThisWeek = new Set(
      enrollments.flatMap((e) =>
        e.user.workoutLogs.filter((l) => l.date >= weekAgo).map(() => e.user.id),
      ),
    );

    const recentNotes: DashboardNote[] = recentNotesRaw.map((n) => ({
      id: n.id,
      athleteId: n.athleteId,
      athleteName: n.athlete.name,
      content: n.content,
      createdAt: n.createdAt,
    }));

    const onboarding: OnboardingAthlete[] = recentEnrollments.map((e) => {
      const hasAnyLog = e.user.workoutLogs.length > 0;

      return {
        userId: e.user.id,
        name: e.user.name,
        image: e.user.image,
        enrolledAt: e.startDate,
        hasAnyLog,
        hasCompletedFirst: hasAnyLog,
        planName: e.trainingPlan.name,
      };
    });

    const recentActivity = enrollments
      .flatMap((e) =>
        e.user.workoutLogs.slice(0, 3).map((log) => ({
          type: "WORKOUT_COMPLETED" as const,
          athleteId: e.user.id,
          athleteName: e.user.name,
          description: `Completed workout`,
          timestamp: log.date,
        })),
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      overview: {
        totalActiveAthletes: uniqueAthletes.size,
        workoutsPlannedToday: uniqueAthletes.size,
        workoutsCompletedToday: completedToday,
        openActionItemsCount: openActionItems.length,
        trainedThisWeekCount: trainedThisWeek.size,
      },
      actionItems,
      athletesSummary,
      loadDistributionToday,
      progressBuckets,
      recentNotes,
      recentActivity,
      onboarding,
    };
  },
};
