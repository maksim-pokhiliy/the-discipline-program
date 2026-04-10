import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../mappers/enum-maps";

export const resolveCoachId = async (userId: string): Promise<string> => {
  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    throw new ForbiddenError("User does not have a coach profile", { userId });
  }

  return profile.id;
};

export const verifyPlanOwnership = async (planId: string, coachId: string): Promise<void> => {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    select: { coachId: true },
  });

  if (!plan) {
    throw new NotFoundError("Training plan not found", { planId });
  }

  if (plan.coachId !== coachId) {
    throw new ForbiddenError("Training plan does not belong to this coach");
  }
};

export const verifyWorkoutOwnership = async (
  workoutId: string,
  coachId: string,
): Promise<{ planId: string }> => {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    select: { planId: true, plan: { select: { coachId: true } } },
  });

  if (!workout) {
    throw new NotFoundError("Workout not found", { workoutId });
  }

  if (workout.plan.coachId !== coachId) {
    throw new ForbiddenError("Workout does not belong to this coach");
  }

  return { planId: workout.planId };
};

export const verifyAthleteBelongsToCoach = async (
  athleteUserId: string,
  coachId: string,
): Promise<void> => {
  const enrollment = await prisma.planEnrollment.findFirst({
    where: {
      userId: athleteUserId,
      trainingPlan: { coachId },
      status: PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP[PlanEnrollmentStatus.ACTIVE],
    },
    select: { id: true },
  });

  if (!enrollment) {
    throw new ForbiddenError("Athlete does not belong to this coach");
  }
};
