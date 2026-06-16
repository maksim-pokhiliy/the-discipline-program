import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coaching/coach-action-item";
import { type CoachAthleteDetail } from "@repo/contracts/coaching/coach-athletes";
import { ForbiddenError } from "@repo/errors";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import {
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_MAP,
  HEALTH_STATUS_MAP,
} from "../../../mappers/coaching";
import { createStartOfDayCache } from "../../../utils/date-helpers";
import { buildAssignedAthleteInclude } from "../assigned-athlete-query";
import {
  computeAthleteMetrics,
  findNextWorkoutForAthlete,
  loadScheduleWindow,
} from "../coach-metrics";

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

  const coach = await prisma.user.findUnique({
    where: { id: coachUserId },
    select: { timezone: true },
  });
  const tz = coach?.timezone ?? "UTC";

  const now = new Date();
  const [window, nextWorkout] = await Promise.all([
    loadScheduleWindow({ athleteIds: [athleteUserId], tz, now }),
    findNextWorkoutForAthlete({ athleteId: athleteUserId, tz, now }),
  ]);

  const metrics = computeAthleteMetrics({
    athleteId: athleteUserId,
    enrollments: window.enrollmentsByAthlete.get(athleteUserId) ?? [],
    performedByKey: window.performedByKey,
    weekCountByPlan: window.weekCountByPlan,
    firstWeekStartByPlan: window.firstWeekStartByPlan,
    tz,
    now,
    startOfDayCache: createStartOfDayCache(tz),
  });

  return {
    userId: athleteUserId,
    name: athlete.name,
    email: athlete.email,
    image: athlete.image,
    healthStatus,
    processStatus: metrics.processStatus,
    planDiscipline: metrics.planDiscipline,
    recentWorkouts: metrics.recentWorkouts,
    actionItems: mappedActionItems,
    nextWorkout,
    consistency: {
      adherenceRate4w: metrics.adherenceRate,
      currentStreak: metrics.currentStreak,
      missedThisWeek: metrics.missedThisWeek,
    },
    enrolledSince: assignment.createdAt,
    lastActivityDate: metrics.lastActivityDate,
    daysSinceLastActivity: metrics.daysSinceLastActivity,
    last7Days: metrics.last7Days,
    currentWeek: metrics.currentWeek,
    totalWeeks: metrics.totalWeeks,
    todayStatus: metrics.todayStatus,
    todayWorkoutTitle: metrics.todayWorkoutTitle,
  };
};
