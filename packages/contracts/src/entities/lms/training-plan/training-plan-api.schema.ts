import { z } from "zod";

import { planIdParamSchema } from "../../../common";
import { workoutSchema } from "../workout";

import {
  createTrainingPlanSchema,
  trainingPlanListItemSchema,
  trainingPlanSchema,
  trainingPlanStatusSchema,
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

export const calendarWorkoutSchema = workoutSchema.extend({
  planName: z.string(),
  planStatus: trainingPlanStatusSchema,
});

export const getCalendarWeekParamsSchema = z.object({
  weekStart: z.coerce.date(),
});

export const getCalendarWeekResponseSchema = z.array(calendarWorkoutSchema);

export const copyWeekParamsSchema = planIdParamSchema;

export const copyWeekRequestSchema = z.object({
  sourceDate: z.coerce.date(),
  targetDate: z.coerce.date(),
});

export const copyWeekResponseSchema = z.array(workoutSchema);
