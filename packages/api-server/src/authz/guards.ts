import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";
import { ROLE_MAP } from "../mappers/iam";
import { findOrThrow } from "../utils";

export const requireAdmin = async (userId: string): Promise<void> => {
  const user = await findOrThrow(
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    "User",
  );

  if (ROLE_MAP[user.role] !== UserRole.ADMIN) {
    throw new ForbiddenError("Admin role required");
  }
};

export const resolveCoachId = async (userId: string): Promise<string> => {
  const profile = await prisma.coachProfile.findFirst({
    where: { userId, deletedAt: null },
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
  const assignment = await prisma.coachAthleteAssignment.findUnique({
    where: { coachId_athleteId: { coachId, athleteId: athleteUserId } },
    select: { id: true },
  });

  if (!assignment) {
    throw new ForbiddenError("Athlete does not belong to this coach");
  }
};

export const verifyExerciseOwnership = async (
  userId: string,
  exerciseId: string,
): Promise<void> => {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { createdByUserId: true },
  });

  if (!exercise) {
    throw new NotFoundError("Exercise not found", { exerciseId });
  }

  if (exercise.createdByUserId !== userId) {
    throw new ForbiddenError("Exercise does not belong to this user");
  }
};
