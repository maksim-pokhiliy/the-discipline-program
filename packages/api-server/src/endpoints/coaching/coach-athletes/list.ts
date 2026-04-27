import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coaching/coach-action-item";
import {
  type CoachAthleteListItem,
  type CoachAthletesData,
} from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";

import { resolveCoachId } from "../../../authz/guards";
import { prisma, prismaAsCore } from "../../../db/client";
import { ACTION_ITEM_STATUS_TO_PRISMA_MAP, HEALTH_STATUS_MAP } from "../../../mappers/coaching";
import { buildAssignedAthleteInclude } from "../assigned-athlete-query";
import { computeAthletesSummary, computeProgressBuckets } from "../dashboard-computations";

export const getAthletes = async (userId: string): Promise<CoachAthletesData> => {
  const coachId = await resolveCoachId(userId);

  const [assignments, actionItemCounts] = await Promise.all([
    prisma.coachAthleteAssignment.findMany({
      where: { coachId, athlete: { deletedAt: null } },
      include: buildAssignedAthleteInclude(userId),
      orderBy: [{ athlete: { name: "asc" } }, { athlete: { email: "asc" } }],
    }),
    prisma.coachActionItem.groupBy({
      by: ["athleteId"],
      where: { coachId, status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.OPEN] },
      _count: { id: true },
    }),
  ]);

  const [athletesSummary, progressBuckets] = await Promise.all([
    computeAthletesSummary({ db: prismaAsCore, assignments }),
    computeProgressBuckets({ db: prismaAsCore, assignments }),
  ]);

  const lastActivityMap = new Map(athletesSummary.map((s) => [s.userId, s.lastActivityDate]));

  const processStatusMap = new Map<string, ProcessStatus>([
    ...progressBuckets.onTrack.map((a) => [a.userId, ProcessStatus.ON_TRACK] as const),
    ...progressBuckets.steady.map((a) => [a.userId, ProcessStatus.STEADY] as const),
    ...progressBuckets.fallingBehind.map((a) => [a.userId, ProcessStatus.FALLING_BEHIND] as const),
  ]);

  const actionItemsMap = new Map(actionItemCounts.map((item) => [item.athleteId, item._count.id]));

  const athletes: CoachAthleteListItem[] = [];
  let needsAttentionCount = 0;
  let injuredCount = 0;
  let restrictedCount = 0;

  for (const a of assignments) {
    const athlete = a.athlete;

    const activePlans = athlete.planEnrollments.map((e) => ({
      id: e.plan.id,
      name: e.plan.name,
    }));

    const firstEnrollment = athlete.planEnrollments[0];
    const earliestStart = firstEnrollment
      ? athlete.planEnrollments.reduce(
          (min, e) => (e.startedOnDate < min ? e.startedOnDate : min),
          firstEnrollment.startedOnDate,
        )
      : a.createdAt;

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

    const lastActivityDate = lastActivityMap.get(athlete.id) ?? null;
    const processStatus = processStatusMap.get(athlete.id) ?? ProcessStatus.FALLING_BEHIND;

    athletes.push({
      userId: athlete.id,
      name: athlete.name,
      email: athlete.email,
      image: athlete.image,
      healthStatus,
      activePlans,
      processStatus,
      lastActivityDate,
      daysSinceLastActivity: null,
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
