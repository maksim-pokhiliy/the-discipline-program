import { type TrainingPlanStatus as PrismaTrainingPlanStatus } from "@prisma/client";

import { type TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { TRAINING_PLAN_STATUS_MAP } from "../mappers/lms";

import { isAdminOrHeadCoach } from "./_role-helpers";
import { resolveCallerRole } from "./resolve-caller-role";

type PlanGrantInput = {
  creatorId: string;
  deletedAt: Date | null;
  status: PrismaTrainingPlanStatus;
};

type NotFoundInfo = {
  message: string;
  meta: Record<string, string>;
};

export const assertPlanAccess = async (
  plan: PlanGrantInput | null,
  userId: string,
  notFound: NotFoundInfo,
): Promise<TrainingPlanStatus> => {
  if (plan === null || plan.deletedAt !== null) {
    throw new NotFoundError(notFound.message, notFound.meta);
  }

  if (plan.creatorId === userId) {
    return TRAINING_PLAN_STATUS_MAP[plan.status];
  }

  const role = await resolveCallerRole(userId);

  if (role !== null && isAdminOrHeadCoach(role)) {
    return TRAINING_PLAN_STATUS_MAP[plan.status];
  }

  throw new ForbiddenError("Resource does not belong to this coach");
};
