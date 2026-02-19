import { z } from "zod";

import {
  createTrainingPlanSchema,
  trainingPlanSchema,
  updateTrainingPlanSchema,
} from "./training-plan.schema";

export const getTrainingPlansResponseSchema = z.array(trainingPlanSchema);

export const getTrainingPlanByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getTrainingPlanResponseSchema = trainingPlanSchema;

export const createTrainingPlanRequestSchema = createTrainingPlanSchema;

export const updateTrainingPlanParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateTrainingPlanRequestSchema = updateTrainingPlanSchema;

export const deleteTrainingPlanParamsSchema = z.object({
  id: z.string().cuid(),
});
