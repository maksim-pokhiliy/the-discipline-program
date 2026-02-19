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
