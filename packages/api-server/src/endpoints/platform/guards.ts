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

export const verifyWorkoutOwnership = async (workoutId: string, coachId: string): Promise<void> => {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    select: { deletedAt: true, plan: { select: { coachId: true, deletedAt: true } } },
  });

  if (!workout || workout.deletedAt) {
    throw new NotFoundError("Workout not found", { workoutId });
  }

  if (workout.plan.deletedAt || workout.plan.coachId !== coachId) {
    throw new ForbiddenError("Workout does not belong to this coach");
  }
};

export const verifyBlockOwnership = async (blockId: string, coachId: string): Promise<void> => {
  const block = await prisma.workoutBlock.findUnique({
    where: { id: blockId },
    select: {
      workout: {
        select: { deletedAt: true, plan: { select: { coachId: true, deletedAt: true } } },
      },
    },
  });

  if (!block) {
    throw new NotFoundError("Workout block not found", { blockId });
  }

  if (
    block.workout.deletedAt ||
    block.workout.plan.deletedAt ||
    block.workout.plan.coachId !== coachId
  ) {
    throw new ForbiddenError("Workout block does not belong to this coach");
  }
};
