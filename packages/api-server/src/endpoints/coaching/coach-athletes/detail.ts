import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coaching/coach-action-item";
import {
  type CoachAthleteDetail,
  type CoachAthleteEnrollment,
} from "@repo/contracts/coaching/coach-athletes";
import { ForbiddenError } from "@repo/errors";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import {
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_MAP,
  GENDER_MAP,
  HEALTH_STATUS_MAP,
} from "../../../mappers/coaching";
import { ENROLLMENT_STATUS_MAP } from "../../../mappers/lms";
import { createStartOfDayCache } from "../../../utils/date-helpers";
import { buildRosterAthleteInclude } from "../assigned-athlete-query";
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

  const [assignment, actionItems, notes, coach] = await Promise.all([
    prisma.coachAthleteAssignment.findUnique({
      where: { coachId_athleteId: { coachId, athleteId: athleteUserId } },
      include: buildRosterAthleteInclude(),
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

    prisma.coachNote.findMany({
      where: { coachId, athleteId: athleteUserId },
      select: { id: true, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),

    prisma.user.findUnique({
      where: { id: coachUserId },
      select: { timezone: true },
    }),
  ]);

  if (!assignment) {
    throw new ForbiddenError("Athlete does not belong to this coach");
  }

  const athlete = assignment.athlete;
  const profile = athlete.athleteProfile;

  const healthStatus = profile ? HEALTH_STATUS_MAP[profile.healthStatus] : HealthStatus.HEALTHY;

  const enrollments: CoachAthleteEnrollment[] = athlete.planEnrollmentsAsAthlete.map(
    (enrollment) => ({
      planId: enrollment.planId,
      planName: enrollment.plan.name,
      status: ENROLLMENT_STATUS_MAP[enrollment.status],
      boardedAt: enrollment.boardedAt,
    }),
  );

  const mappedActionItems = actionItems.map((item) => ({
    id: item.id,
    type: ACTION_ITEM_TYPE_MAP[item.type],
    severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
    message: item.message,
    createdAt: item.createdAt,
  }));

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
    healthNote: profile?.healthNote ?? null,
    gender: profile?.gender ? GENDER_MAP[profile.gender] : null,
    heightCm: profile?.heightCm ?? null,
    weightKg: profile?.weightKg ? Number(profile.weightKg) : null,
    processStatus: metrics.processStatus,
    enrollments,
    planDiscipline: metrics.planDiscipline,
    recentWorkouts: metrics.recentWorkouts,
    actionItems: mappedActionItems,
    notes,
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
