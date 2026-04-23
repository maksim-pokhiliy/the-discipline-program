import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coaching/coach-action-item";
import type {
  CoachAthleteListItem,
  CoachAthletesData,
} from "@repo/contracts/coaching/coach-athletes";

import { resolveCoachId } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { ACTION_ITEM_STATUS_TO_PRISMA_MAP, HEALTH_STATUS_MAP } from "../../../mappers/coaching";
import { findOrThrow } from "../../../utils";
import {
  DAYS_IN_WEEK,
  daysBetweenInTz,
  MS_PER_DAY,
  startOfTodayInTz,
  TWO_WEEKS,
} from "../../../utils/date-helpers";
import { buildAssignedAthleteInclude } from "../assigned-athlete-query";
import { computeAdherenceWindow, computeProcessStatus } from "../dashboard-computations";

export const getAthletes = async (userId: string): Promise<CoachAthletesData> => {
  const coachId = await resolveCoachId(userId);

  const { timezone: tz } = await findOrThrow(
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
    "User",
  );

  const [assignments, actionItemCounts] = await Promise.all([
    prisma.coachAthleteAssignment.findMany({
      where: { coachId, athlete: { deletedAt: null } },
      include: buildAssignedAthleteInclude(coachId),
      orderBy: [{ athlete: { name: "asc" } }, { athlete: { email: "asc" } }],
    }),
    prisma.coachActionItem.groupBy({
      by: ["athleteId"],
      where: { coachId, status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.OPEN] },
      _count: { id: true },
    }),
  ]);

  const actionItemsMap = new Map(actionItemCounts.map((item) => [item.athleteId, item._count.id]));

  const now = new Date();
  const today = startOfTodayInTz(tz);
  const currentStart = new Date(now.getTime() - DAYS_IN_WEEK * MS_PER_DAY);
  const previousStart = new Date(now.getTime() - TWO_WEEKS * MS_PER_DAY);

  const athletes: CoachAthleteListItem[] = [];
  let needsAttentionCount = 0;
  let injuredCount = 0;
  let restrictedCount = 0;

  for (const a of assignments) {
    const athlete = a.athlete;
    const loggedIds = new Set(athlete.workoutLogs.map((l) => l.workoutId));
    const allWorkouts = athlete.planEnrollments.flatMap((e) => e.trainingPlan.workouts);

    const curWindow = computeAdherenceWindow(allWorkouts, loggedIds, currentStart, now);
    const prevWindow = computeAdherenceWindow(allWorkouts, loggedIds, previousStart, currentStart);

    const curRate = curWindow.available > 0 ? curWindow.completed / curWindow.available : 0;
    const prevRate = prevWindow.available > 0 ? prevWindow.completed / prevWindow.available : 0;
    const processStatus = computeProcessStatus(curRate, prevRate);

    const activePlans = athlete.planEnrollments.map((e) => ({
      id: e.trainingPlan.id,
      name: e.trainingPlan.name,
    }));

    const firstEnrollment = athlete.planEnrollments[0];
    const earliestStart = firstEnrollment
      ? athlete.planEnrollments.reduce(
          (min, e) => (e.startDate < min ? e.startDate : min),
          firstEnrollment.startDate,
        )
      : a.createdAt;

    const lastLog = athlete.workoutLogs[0] ?? null;
    const lastActivityDate = lastLog?.date ?? null;

    const daysSinceLastActivity = lastActivityDate
      ? daysBetweenInTz(new Date(lastActivityDate), today, tz)
      : null;

    const healthStatus = athlete.athleteProfile
      ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY;

    const openActionItemsCount = actionItemsMap.get(athlete.id) ?? 0;
    const needsAttention = openActionItemsCount > 0;

    if (needsAttention) {
      needsAttentionCount++;
    }

    if (healthStatus === HealthStatus.INJURED) {
      injuredCount++;
    }

    if (healthStatus === HealthStatus.RESTRICTED) {
      restrictedCount++;
    }

    athletes.push({
      userId: athlete.id,
      name: athlete.name,
      email: athlete.email,
      image: athlete.image,
      healthStatus,
      activePlans,
      processStatus,
      lastActivityDate,
      daysSinceLastActivity,
      openActionItemsCount,
      needsAttention,
      isPending: athlete.password === null,
      enrolledSince: earliestStart,
    });
  }

  return {
    summary: {
      total: assignments.length,
      active: assignments.length,
      needsAttention: needsAttentionCount,
      injured: injuredCount,
      restricted: restrictedCount,
    },
    athletes,
  };
};
