import { SEVERITY_PRIORITY, TYPE_PRIORITY } from "@repo/contracts/coach-action-item";
import {
  CoachActivityType,
  type CoachDashboardData,
  type DashboardActionItem,
  type DashboardNote,
  type OnboardingAthlete,
} from "@repo/contracts/coach-dashboard";

import { prisma } from "../../db/client";
import {
  computeAthletesSummary,
  computeLoadDistribution,
  computeProgressBuckets,
} from "../../utils/dashboard-computations";
import { endOfWeek, startOfDay, startOfToday, startOfWeek } from "../../utils/date-helpers";
import { enrollmentInclude } from "../../utils/enrollment-query";

import { platformCoachActionItemsApi } from "./coach-action-items";
import { resolveCoachId } from "./guards";

export const platformCoachDashboardApi = {
  getDashboard: async (userId: string): Promise<CoachDashboardData> => {
    await platformCoachActionItemsApi.reconcile(userId);

    const coachId = await resolveCoachId(userId);
    const today = startOfToday();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    const [enrollments, openActionItems, recentNotesRaw, recentEnrollments, activePlansCount] =
      await Promise.all([
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
            startDate: { gte: weekStart },
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

        prisma.trainingPlan.count({
          where: { coachId, status: "ACTIVE", deletedAt: null },
        }),
      ]);

    const athletesSummary = computeAthletesSummary(enrollments);
    const loadDistributionToday = computeLoadDistribution(enrollments);
    const progressBuckets = computeProgressBuckets(enrollments);

    const uniqueAthletes = new Set(enrollments.map((e) => e.user.id));

    const seen = new Set<string>();
    let plannedToday = 0;
    let completedToday = 0;
    let plannedThisWeek = 0;
    let completedThisWeek = 0;

    for (const e of enrollments) {
      const loggedIds = new Set(e.user.workoutLogs.map((l) => l.workoutId));

      for (const w of e.trainingPlan.workouts) {
        if (!w.scheduledDate) {
          continue;
        }

        const key = `${e.user.id}:${w.id}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);

        const d = startOfDay(w.scheduledDate);
        const isThisWeek = d.getTime() >= weekStart.getTime() && d.getTime() <= weekEnd.getTime();

        if (!isThisWeek) {
          continue;
        }

        const isToday = d.getTime() === today.getTime();
        const isLogged = loggedIds.has(w.id);

        plannedThisWeek++;

        if (isLogged) {
          completedThisWeek++;
        }

        if (isToday) {
          plannedToday++;

          if (isLogged) {
            completedToday++;
          }
        }
      }
    }

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
      .sort(
        (a, b) =>
          TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type] ||
          SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity],
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
          type: CoachActivityType.WORKOUT_COMPLETED,
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
        activePlansCount,
        workoutsPlannedToday: plannedToday,
        workoutsCompletedToday: completedToday,
        workoutsPlannedThisWeek: plannedThisWeek,
        workoutsCompletedThisWeek: completedThisWeek,
        openActionItemsCount: openActionItems.length,
        newAthletesCount: recentEnrollments.length,
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
