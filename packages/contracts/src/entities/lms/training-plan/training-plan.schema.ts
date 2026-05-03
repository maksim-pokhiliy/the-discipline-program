import { z } from "zod";

import { TRAINING_PLAN_CONSTANTS, TrainingPlanStatus } from "./training-plan.constants";

export const trainingPlanStatusSchema = z.nativeEnum(TrainingPlanStatus);

export const trainingPlanSchema = z.object({
  id: z.string().cuid(),
  creatorId: z.string().cuid(),
  name: z.string().min(1).max(TRAINING_PLAN_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().nullable(),
  status: trainingPlanStatusSchema,
  licensable: z.boolean(),
  originalPlanId: z.string().cuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTrainingPlanSchema = z.object({
  name: z.string().min(1).max(TRAINING_PLAN_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(TRAINING_PLAN_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
});

export const updateTrainingPlanSchema = z.object({
  name: z.string().min(1).max(TRAINING_PLAN_CONSTANTS.MAX_NAME_LENGTH).optional(),
  description: z.string().max(TRAINING_PLAN_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable().optional(),
});

export const trainingPlanListItemSchema = trainingPlanSchema;
