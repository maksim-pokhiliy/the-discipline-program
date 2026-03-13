import { z } from "zod";

import { workoutSchema } from "../workout/workout.schema";

import { trainingPlanStatusSchema } from "./training-plan.schema";
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

export const calendarWorkoutSchema = workoutSchema.extend({
  planId: z.string().cuid(),
  planName: z.string(),
  planStatus: trainingPlanStatusSchema,
  blockCount: z.number().int(),
});

export const getCalendarWeekParamsSchema = z.object({
  weekStart: z.coerce.date(),
});

export const getCalendarWeekResponseSchema = z.array(calendarWorkoutSchema);

export const copyWeekParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const copyWeekRequestSchema = z.object({
  sourceDate: z.coerce.date(),
  targetDate: z.coerce.date(),
});
