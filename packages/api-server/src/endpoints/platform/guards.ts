import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

export const resolveCoachId = async (userId: string): Promise<string> => {
  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
    select: { id: true, deletedAt: true },
  });

  if (!profile || profile.deletedAt) {
    throw new ForbiddenError("User does not have a coach profile", { userId });
  }

  return profile.id;
};

export const verifyPlanOwnership = async (planId: string, coachId: string): Promise<void> => {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    select: { coachId: true, deletedAt: true },
  });

  if (!plan || plan.deletedAt) {
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
    select: { planId: true, deletedAt: true, plan: { select: { coachId: true, deletedAt: true } } },
  });

  if (!workout || workout.deletedAt) {
    throw new NotFoundError("Workout not found", { workoutId });
  }

  if (workout.plan.deletedAt || workout.plan.coachId !== coachId) {
    throw new ForbiddenError("Workout does not belong to this coach");
  }

  return { planId: workout.planId };
};

export const resolveCoachAthleteIds = async (coachId: string): Promise<string[]> => {
  const enrollments = await prisma.planEnrollment.findMany({
    where: {
      trainingPlan: { coachId, deletedAt: null },
      status: PlanEnrollmentStatus.ACTIVE,
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  return enrollments.map((e) => e.userId);
};

export const verifyAthleteBelongsToCoach = async (
  athleteUserId: string,
  coachId: string,
): Promise<void> => {
  const enrollment = await prisma.planEnrollment.findFirst({
    where: {
      userId: athleteUserId,
      trainingPlan: { coachId, deletedAt: null },
      status: PlanEnrollmentStatus.ACTIVE,
    },
    select: { id: true },
  });

  if (!enrollment) {
    throw new ForbiddenError("Athlete does not belong to this coach");
  }
};
