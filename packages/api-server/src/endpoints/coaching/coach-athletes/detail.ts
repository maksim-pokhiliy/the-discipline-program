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
import { PLAN_ENROLLMENT_STATUS_MAP } from "../../../mappers/lms";
import { MS_PER_DAY } from "../../../utils/date-helpers";
import { buildAssignedAthleteInclude } from "../assigned-athlete-query";

export const getAthleteDetail = async (
  coachUserId: string,
  athleteUserId: string,
): Promise<CoachAthleteDetail> => {
  const coachId = await resolveCoachId(coachUserId);

  await verifyAthleteBelongsToCoach(athleteUserId, coachId);

  const now = new Date();
  const window28Start = new Date(now.getTime() - 28 * MS_PER_DAY);
  const week7Start = new Date(now.getTime() - 7 * MS_PER_DAY);

  const [assignment, actionItems, rawRecentWorkouts, adherenceSessions, weekSessions] =
    await Promise.all([
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

      prisma.workoutSession.findMany({
        where: { userId: athleteUserId },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: {
          enrollment: { select: { plan: { select: { name: true } } } },
        },
      }),

      prisma.workoutSession.findMany({
        where: { userId: athleteUserId, startedAt: { gte: window28Start, lte: now } },
        select: { completionRatio: true },
      }),

      prisma.workoutSession.findMany({
        where: { userId: athleteUserId, startedAt: { gte: week7Start, lte: now } },
        select: { completionRatio: true },
      }),
    ]);

  if (!assignment) {
    throw new ForbiddenError("Athlete does not belong to this coach");
  }

  const athlete = assignment.athlete;
  const enrollments = athlete.planEnrollments;

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

  const planDiscipline = enrollments.map((e) => ({
    planId: e.plan.id,
    planName: e.plan.name,
    enrollmentStatus: PLAN_ENROLLMENT_STATUS_MAP[e.status],
    enrolledDate: e.startedOnDate,
    completed: 0,
    available: 0,
    planned: 0,
  }));

  const earliestEnrollment = enrollments.reduce<Date | null>(
    (min, e) => (min === null || e.startedOnDate < min ? e.startedOnDate : min),
    null,
  );

  const recentWorkouts = rawRecentWorkouts.map((s) => ({
    id: s.id,
    title: s.enrollment?.plan.name ?? "Workout",
    date: s.startedAt,
    planName: s.enrollment?.plan.name ?? "",
  }));

  const planned28 = adherenceSessions.length;
  const completed28 = adherenceSessions.filter(
    (s) => s.completionRatio !== null && Number(s.completionRatio) >= 0.9,
  ).length;
  const adherenceRate4w = planned28 === 0 ? 0 : completed28 / planned28;

  const missedThisWeek = weekSessions.filter(
    (s) => s.completionRatio === null || Number(s.completionRatio) < 0.9,
  ).length;

  return {
    userId: athleteUserId,
    name: athlete.name,
    email: athlete.email,
    image: athlete.image,
    healthStatus,
    processStatus: ProcessStatus.STEADY,
    planDiscipline,
    recentWorkouts,
    actionItems: mappedActionItems,
    nextWorkout: null,
    consistency: {
      adherenceRate4w,
      currentStreak: 0,
      missedThisWeek,
    },
    enrolledSince: earliestEnrollment ?? assignment.createdAt,
    lastActivityDate: null,
    daysSinceLastActivity: null,
  };
};
