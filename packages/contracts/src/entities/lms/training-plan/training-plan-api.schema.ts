import { z } from "zod";

import { planIdParamSchema } from "../../../common";

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

export const getTrainingPlanByIdParamsSchema = planIdParamSchema;

export const getTrainingPlanResponseSchema = trainingPlanSchema;

export const createTrainingPlanRequestSchema = createTrainingPlanSchema;

export const createTrainingPlanResponseSchema = trainingPlanSchema;

export const updateTrainingPlanParamsSchema = planIdParamSchema;

export const updateTrainingPlanRequestSchema = updateTrainingPlanSchema;

export const updateTrainingPlanResponseSchema = trainingPlanSchema;

export const deleteTrainingPlanParamsSchema = planIdParamSchema;

export const duplicateTrainingPlanParamsSchema = planIdParamSchema;

export const duplicateTrainingPlanResponseSchema = trainingPlanSchema;

export const archiveTrainingPlanParamsSchema = planIdParamSchema;

export const restoreTrainingPlanParamsSchema = planIdParamSchema;
