import {
  type CreateTrainingPlanData,
  type TrainingPlan,
  type UpdateTrainingPlanData,
} from "@repo/contracts/training-plan";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToTrainingPlan } from "../../mappers";

import { resolveCoachId, verifyPlanOwnership } from "./guards";

export const platformTrainingPlansApi = {
  getAll: async (userId: string): Promise<TrainingPlan[]> => {
    const coachId = await resolveCoachId(userId);

    const plans = await prisma.trainingPlan.findMany({
      where: { coachId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return plans.map(mapToTrainingPlan);
  },

  getById: async (userId: string, id: string): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const plan = await prisma.trainingPlan.findUnique({
      where: { id },
    });

    if (!plan || plan.deletedAt) {
      throw new NotFoundError("Training plan not found", { id });
    }

    return mapToTrainingPlan(plan);
  },

  create: async (userId: string, data: CreateTrainingPlanData): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    const plan = await prisma.trainingPlan.create({
      data: { coachId, ...data },
    });

    return mapToTrainingPlan(plan);
  },

  update: async (
    userId: string,
    id: string,
    data: UpdateTrainingPlanData,
  ): Promise<TrainingPlan> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    const plan = await prisma.trainingPlan.update({
      where: { id },
      data,
    });

    return mapToTrainingPlan(plan);
  },

  delete: async (userId: string, id: string): Promise<void> => {
    const coachId = await resolveCoachId(userId);

    await verifyPlanOwnership(id, coachId);

    await prisma.trainingPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
