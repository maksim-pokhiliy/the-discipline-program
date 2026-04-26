import { type TrainingPlan as PrismaTrainingPlan } from "@prisma/client";

import { type TrainingPlan } from "@repo/contracts/lms/training-plan";

import { TRAINING_PLAN_STATUS_MAP } from "./enum-maps";

export const mapToTrainingPlan = (p: PrismaTrainingPlan): TrainingPlan => ({
  id: p.id,
  creatorId: p.creatorId,
  name: p.name,
  description: p.description,
  status: TRAINING_PLAN_STATUS_MAP[p.status],
  licensable: p.licensable,
  originalPlanId: p.originalPlanId,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
