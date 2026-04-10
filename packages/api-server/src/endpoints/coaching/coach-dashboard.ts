import {
  ActionItemStatus,
  SEVERITY_PRIORITY,
  TYPE_PRIORITY,
} from "@repo/contracts/coaching/coach-action-item";
import {
  type CoachDashboardData,
  type DashboardActionItem,
} from "@repo/contracts/coaching/coach-dashboard";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { prisma } from "../../db/client";
import {
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_MAP,
} from "../../mappers/coaching";
import {
  PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP,
  TRAINING_PLAN_STATUS_TO_PRISMA_MAP,
} from "../../mappers/lms";
import { findOrThrow } from "../../utils";
import {
  endOfWeekInTz,
  startOfDayInTz,
  startOfTodayInTz,
  startOfWeekInTz,
} from "../../utils/date-helpers";

import { coachingCoachActionItemApi } from "./coach-action-item";
import { computeAthletesSummary, computeProgressBuckets } from "./dashboard-computations";
import { createEnrollmentInclude } from "./enrollment-query";

export const coachingCoachDashboardApi = {
  getDashboard: async (userId: string): Promise<CoachDashboardData> => {
    const { coachId } = await coachingCoachActionItemApi.reconcile(userId);

    const user = await findOrThrow(
      prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
      "User",
    );

    const tz = user.timezone;
    const today = startOfTodayInTz(tz);
    const weekStart = startOfWeekInTz(today, tz);
    const weekEnd = endOfWeekInTz(today, tz);

    const [enrollments, openActionItems, activePlansCount] = await Promise.all([
      prisma.planEnrollment.findMany({
        where: {
          status: PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP[PlanEnrollmentStatus.ACTIVE],
          trainingPlan: { coachId },
        },
        include: createEnrollmentInclude(coachId),
      }),

      prisma.coachActionItem.findMany({
        where: { coachId, status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.OPEN] },
        include: {
          athlete: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.trainingPlan.count({
        where: { coachId, status: TRAINING_PLAN_STATUS_TO_PRISMA_MAP[TrainingPlanStatus.ACTIVE] },
      }),
    ]);

    const athletesSummary = computeAthletesSummary(enrollments, tz);
    const progressBuckets = computeProgressBuckets(enrollments);

    const uniqueAthletes = new Set(enrollments.map((e) => e.user.id));
    const recentAthletes = new Set<string>();

    const seen = new Set<string>();
    let plannedToday = 0;
    let completedToday = 0;
    let plannedThisWeek = 0;
    let completedThisWeek = 0;

    for (const e of enrollments) {
      const loggedIds = new Set(e.user.workoutLogs.map((l) => l.workoutId));

      if (e.startDate && e.startDate >= weekStart) {
        recentAthletes.add(e.user.id);
      }

      for (const w of e.trainingPlan.workouts) {
        if (!w.scheduledDate) {
          continue;
        }

        const key = `${e.user.id}:${w.id}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);

        const d = startOfDayInTz(w.scheduledDate, tz);
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
        type: ACTION_ITEM_TYPE_MAP[item.type],
        severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
        athleteId: item.athleteId,
        athleteName: item.athlete.name,
        athleteImage: item.athlete.image,
        message: item.message,
        href: `/coach/athletes?athlete=${item.athleteId}`,
        createdAt: item.createdAt,
      }))
      .sort(
        (a, b) =>
          TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type] ||
          SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity],
      );

    return {
      overview: {
        totalActiveAthletes: uniqueAthletes.size,
        activePlansCount,
        workoutsPlannedToday: plannedToday,
        workoutsCompletedToday: completedToday,
        workoutsPlannedThisWeek: plannedThisWeek,
        workoutsCompletedThisWeek: completedThisWeek,
        openActionItemsCount: openActionItems.length,
        newAthletesCount: recentAthletes.size,
      },
      actionItems,
      athletesSummary,
      progressBuckets,
    };
  },
};
