import { z } from "zod";

import { planIdParamSchema } from "../../common";

import { createWorkoutSchema, updateWorkoutSchema, workoutSchema } from "./workout.schema";

const planIdWithIdParamSchema = planIdParamSchema.extend({ id: z.string().cuid() });

export const getWorkoutsParamsSchema = planIdParamSchema;

export const getWorkoutsResponseSchema = z.array(workoutSchema);

export const getWorkoutByIdParamsSchema = planIdWithIdParamSchema;

export const getWorkoutResponseSchema = workoutSchema;

export const createWorkoutParamsSchema = planIdParamSchema;

export const createWorkoutRequestSchema = createWorkoutSchema;

export const createWorkoutResponseSchema = workoutSchema;

export const updateWorkoutParamsSchema = planIdWithIdParamSchema;

export const updateWorkoutRequestSchema = updateWorkoutSchema;

export const updateWorkoutResponseSchema = workoutSchema;

export const deleteWorkoutParamsSchema = planIdWithIdParamSchema;

export const moveWorkoutParamsSchema = z.object({
  workoutId: z.string().cuid(),
});

export const moveWorkoutRequestSchema = z.object({
  scheduledDate: z.coerce.date(),
  targetDayOrderedIds: z.array(z.string().cuid()).optional(),
});

export const moveWorkoutResponseSchema = workoutSchema;

export const reorderWorkoutsParamsSchema = planIdParamSchema;

export const reorderWorkoutsRequestSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1),
});
