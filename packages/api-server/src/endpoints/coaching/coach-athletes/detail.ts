import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coaching/coach-action-item";
import { type CoachAthleteDetail } from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
import { ForbiddenError } from "@repo/errors";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import {
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_MAP,
  HEALTH_STATUS_MAP,
} from "../../../mappers/coaching";
import { buildAssignedAthleteInclude } from "../assigned-athlete-query";

export const getAthleteDetail = async (
  coachUserId: string,
  athleteUserId: string,
): Promise<CoachAthleteDetail> => {
  const coachId = await resolveCoachId(coachUserId);

  await verifyAthleteBelongsToCoach(athleteUserId, coachId);

  const [assignment, actionItems] = await Promise.all([
    prisma.coachAthleteAssignment.findUnique({
      where: { coachId_athleteId: { coachId, athleteId: athleteUserId } },
      include: buildAssignedAthleteInclude(coachUserId),
    }),

    prisma.coachActionItem.findMany({
      where: {
        coachId,
        athleteId: athleteUserId,
        status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.OPEN],
      },
      select: { id: true, type: true, severity: true, message: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!assignment) {
    throw new ForbiddenError("Athlete does not belong to this coach");
  }

  const athlete = assignment.athlete;

  const healthStatus = athlete.athleteProfile
    ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
    : HealthStatus.HEALTHY;

  const mappedActionItems = actionItems.map((item) => ({
    id: item.id,
    type: ACTION_ITEM_TYPE_MAP[item.type],
    severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
    message: item.message,
    createdAt: item.createdAt,
  }));

  return {
    userId: athleteUserId,
    name: athlete.name,
    email: athlete.email,
    image: athlete.image,
    healthStatus,
    processStatus: ProcessStatus.STEADY,
    planDiscipline: [],
    recentWorkouts: [],
    actionItems: mappedActionItems,
    nextWorkout: null,
    consistency: {
      adherenceRate4w: 0,
      currentStreak: 0,
      missedThisWeek: 0,
    },
    enrolledSince: assignment.createdAt,
    lastActivityDate: null,
    daysSinceLastActivity: null,
  };
};
