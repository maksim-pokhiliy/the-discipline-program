import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coaching/coach-action-item";
import {
  type CoachAthleteDetail,
  type CoachAthleteEnrollment,
} from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
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
import { ENROLLMENT_STATUS_MAP } from "../../../mappers/lms/enum-maps-status";
import { buildRosterAthleteInclude } from "../assigned-athlete-query";

const MS_PER_DAY = 86_400_000;

export const getAthleteDetail = async (
  coachUserId: string,
  athleteUserId: string,
): Promise<CoachAthleteDetail> => {
  const coachId = await resolveCoachId(coachUserId);

  await verifyAthleteBelongsToCoach(athleteUserId, coachId);

  const [assignment, actionItems, lastSession, notes] = await Promise.all([
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

    prisma.performedSession.aggregate({
      where: { userId: athleteUserId, completedAt: { not: null } },
      _max: { completedAt: true },
    }),

    prisma.coachNote.findMany({
      where: { coachId, athleteId: athleteUserId },
      select: { id: true, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
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

  const lastActivityDate = lastSession._max.completedAt ?? null;
  const daysSinceLastActivity =
    lastActivityDate !== null
      ? Math.floor((Date.now() - lastActivityDate.getTime()) / MS_PER_DAY)
      : null;

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
    processStatus: ProcessStatus.STEADY,
    enrollments,
    planDiscipline: [],
    recentWorkouts: [],
    actionItems: actionItems.map((item) => ({
      id: item.id,
      type: ACTION_ITEM_TYPE_MAP[item.type],
      severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
      message: item.message,
      createdAt: item.createdAt,
    })),
    notes: notes.map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
    })),
    nextWorkout: null,
    consistency: {
      adherenceRate4w: 0,
      currentStreak: 0,
      missedThisWeek: 0,
    },
    enrolledSince: assignment.createdAt,
    lastActivityDate,
    daysSinceLastActivity,
  };
};
