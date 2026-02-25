import { z } from "zod";

import {
  createTrainingPlanSchema,
  trainingPlanListItemSchema,
  trainingPlanSchema,
  updateTrainingPlanSchema,
} from "./training-plan.schema";

export const getTrainingPlansResponseSchema = z.array(trainingPlanSchema);

export const coachPlansPageDataSchema = z.object({
  plans: z.array(trainingPlanListItemSchema),
});

export const getTrainingPlanByIdParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const getTrainingPlanResponseSchema = trainingPlanSchema;

export const createTrainingPlanRequestSchema = createTrainingPlanSchema;

export const createTrainingPlanResponseSchema = trainingPlanSchema;

export const updateTrainingPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const updateTrainingPlanRequestSchema = updateTrainingPlanSchema;

export const updateTrainingPlanResponseSchema = trainingPlanSchema;

export const deleteTrainingPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const duplicateTrainingPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const duplicateTrainingPlanResponseSchema = trainingPlanSchema;

export const archiveTrainingPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const restoreTrainingPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});
