import { type TrainingPlan as PrismaTrainingPlan } from "@prisma/client";

import { type TrainingPlan, type TrainingPlanStatus } from "@repo/contracts/training-plan";

export const mapToTrainingPlan = (p: PrismaTrainingPlan): TrainingPlan => ({
  id: p.id,
  coachId: p.coachId,
  name: p.name,
  description: p.description,
  status: p.status as TrainingPlanStatus,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
