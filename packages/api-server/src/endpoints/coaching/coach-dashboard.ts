import {
  ActionItemStatus,
  SEVERITY_PRIORITY,
  TYPE_PRIORITY,
} from "@repo/contracts/coaching/coach-action-item";
import {
  type CoachDashboardData,
  type DashboardActionItem,
} from "@repo/contracts/coaching/coach-dashboard";
import { UserRole } from "@repo/contracts/iam/auth";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { prisma, prismaAsCore } from "../../db/client";
import {
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_MAP,
} from "../../mappers/coaching";
import { ROLE_MAP } from "../../mappers/iam";
import { TRAINING_PLAN_STATUS_TO_PRISMA_MAP } from "../../mappers/lms";
import { findOrThrow } from "../../utils";
import { startOfTodayInTz, startOfWeekInTz } from "../../utils/date-helpers";

import { buildAssignedAthleteInclude } from "./assigned-athlete-query";
import { coachingCoachActionItemApi } from "./coach-action-item";
import {
  computeAthletesSummary,
  computeProgressBuckets,
  computeTodayStatus,
  computeWeekStatus,
} from "./dashboard-computations";

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

    const [athletesSummary, progressBuckets, todayStatus, weekStatus] = await Promise.all([
      computeAthletesSummary({ db: prismaAsCore, assignments }),
      computeProgressBuckets({ db: prismaAsCore, assignments }),
      computeTodayStatus({ db: prismaAsCore, userId, timezone: tz }),
      computeWeekStatus({ db: prismaAsCore, userId, timezone: tz }),
    ]);

    const recentAthletes = new Set<string>();

    for (const a of assignments) {
      if (a.createdAt >= weekStart) {
        recentAthletes.add(a.athlete.id);
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
        workoutsPlannedToday: todayStatus.workoutsPlannedToday,
        workoutsCompletedToday: todayStatus.workoutsCompletedToday,
        workoutsPlannedThisWeek: weekStatus.workoutsPlannedThisWeek,
        workoutsCompletedThisWeek: weekStatus.workoutsCompletedThisWeek,
        openActionItemsCount: openActionItems.length,
        newAthletesCount: recentAthletes.size,
      },
      actionItems,
      athletesSummary,
      progressBuckets,
    };
  },
};
