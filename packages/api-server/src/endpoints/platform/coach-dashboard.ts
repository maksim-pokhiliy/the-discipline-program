import { SEVERITY_PRIORITY } from "@repo/contracts/coach-action-item";
import {
  type CoachDashboardData,
  type DashboardActionItem,
  type DashboardNote,
  type EndingPlan,
  type OnboardingAthlete,
  NEW_ATHLETE_THRESHOLD_DAYS,
  PLAN_ENDING_THRESHOLD_DAYS,
} from "@repo/contracts/coach-dashboard";

import { prisma } from "../../db/client";
import {
  computeAthletesSummary,
  computeLoadDistribution,
  computeProgressBuckets,
} from "../../utils/dashboard-computations";
import { daysBetween } from "../../utils/date-helpers";
import { enrollmentInclude } from "../../utils/enrollment-query";

import { resolveCoachId } from "./guards";

export const platformCoachDashboardApi = {
  getDashboard: async (userId: string): Promise<CoachDashboardData> => {
    const coachId = await resolveCoachId(userId);

    const now = new Date();
    const thresholdDate = new Date(now);

    thresholdDate.setDate(thresholdDate.getDate() - NEW_ATHLETE_THRESHOLD_DAYS);
    const endingThreshold = new Date(now);

    endingThreshold.setDate(endingThreshold.getDate() + PLAN_ENDING_THRESHOLD_DAYS);

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

    const endingPlans: EndingPlan[] = enrollments
      .filter((e) => {
        if (!e.endDate) {
          return false;
        }

        const daysLeft = daysBetween(now, new Date(e.endDate));

        return daysLeft >= 0 && daysLeft <= PLAN_ENDING_THRESHOLD_DAYS;
      })
      .map((e) => {
        const daysLeft = daysBetween(now, new Date(e.endDate!));

        return {
          athleteId: e.user.id,
          athleteName: e.user.name,
          planId: e.trainingPlan.id,
          planName: e.trainingPlan.name,
          endDate: e.endDate!,
          daysLeft,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

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
        endingPlansCount: endingPlans.length,
      },
      actionItems,
      athletesSummary,
      loadDistributionToday,
      progressBuckets,
      recentNotes,
      recentActivity,
      onboarding,
      endingPlans,
    };
  },
};
