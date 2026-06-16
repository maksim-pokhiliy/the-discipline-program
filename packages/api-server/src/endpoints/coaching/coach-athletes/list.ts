import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coaching/coach-action-item";
import {
  type CoachAthleteEnrollment,
  type CoachAthleteListItem,
  type CoachAthletesData,
} from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";

import { resolveCoachId } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import {
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  GENDER_MAP,
  HEALTH_STATUS_MAP,
} from "../../../mappers/coaching";
import { ENROLLMENT_STATUS_MAP } from "../../../mappers/lms/enum-maps-status";
import { buildRosterAthleteInclude } from "../assigned-athlete-query";

const MS_PER_DAY = 86_400_000;

export const getAthletes = async (userId: string): Promise<CoachAthletesData> => {
  const coachId = await resolveCoachId(userId);

  const assignments = await prisma.coachAthleteAssignment.findMany({
    where: { coachId, athlete: { deletedAt: null } },
    include: buildRosterAthleteInclude(),
    orderBy: [{ athlete: { name: "asc" } }, { athlete: { email: "asc" } }],
  });

  const athleteIds = assignments.map((assignment) => assignment.athlete.id);

  const [actionItemCounts, lastSessions] = await Promise.all([
    prisma.coachActionItem.groupBy({
      by: ["athleteId"],
      where: { coachId, status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.OPEN] },
      _count: { id: true },
    }),
    prisma.performedSession.groupBy({
      by: ["userId"],
      where: { userId: { in: athleteIds }, completedAt: { not: null } },
      _max: { completedAt: true },
    }),
  ]);

  const actionItemsMap = new Map(actionItemCounts.map((item) => [item.athleteId, item._count.id]));
  const lastActivityMap = new Map(
    lastSessions.map((session) => [session.userId, session._max.completedAt]),
  );

  const now = Date.now();

  const athletes: CoachAthleteListItem[] = [];
  let needsAttentionCount = 0;
  let injuredCount = 0;
  let restrictedCount = 0;

  for (const assignment of assignments) {
    const athlete = assignment.athlete;
    const profile = athlete.athleteProfile;

    const healthStatus = profile ? HEALTH_STATUS_MAP[profile.healthStatus] : HealthStatus.HEALTHY;
    const openActionItemsCount = actionItemsMap.get(athlete.id) ?? 0;
    const needsAttention = openActionItemsCount > 0;

    const lastActivityDate = lastActivityMap.get(athlete.id) ?? null;
    const daysSinceLastActivity =
      lastActivityDate !== null
        ? Math.floor((now - lastActivityDate.getTime()) / MS_PER_DAY)
        : null;

    if (needsAttention) {
      needsAttentionCount++;
    }

    if (healthStatus === HealthStatus.INJURED) {
      injuredCount++;
    }

    if (healthStatus === HealthStatus.RESTRICTED) {
      restrictedCount++;
    }

    const enrollments: CoachAthleteEnrollment[] = athlete.planEnrollmentsAsAthlete.map(
      (enrollment) => ({
        planId: enrollment.planId,
        planName: enrollment.plan.name,
        status: ENROLLMENT_STATUS_MAP[enrollment.status],
        boardedAt: enrollment.boardedAt,
      }),
    );

    athletes.push({
      userId: athlete.id,
      name: athlete.name,
      email: athlete.email,
      image: athlete.image,
      healthStatus,
      healthNote: profile?.healthNote ?? null,
      gender: profile?.gender ? GENDER_MAP[profile.gender] : null,
      heightCm: profile?.heightCm ?? null,
      weightKg: profile?.weightKg ? Number(profile.weightKg) : null,
      enrollments,
      processStatus: ProcessStatus.STEADY,
      lastActivityDate,
      daysSinceLastActivity,
      openActionItemsCount,
      needsAttention,
      isPending: athlete.password === null,
      enrolledSince: assignment.createdAt,
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
