import { z } from "zod";

import { createWorkoutSchema, updateWorkoutSchema, workoutSchema } from "./workout.schema";

export const getWorkoutsParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const getWorkoutsResponseSchema = z.array(workoutSchema);

export const getWorkoutByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  id: z.string().cuid(),
});

export const getWorkoutResponseSchema = workoutSchema;

export const createWorkoutParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const createWorkoutRequestSchema = createWorkoutSchema;

export const createWorkoutResponseSchema = workoutSchema;

export const updateWorkoutParamsSchema = z.object({
  planId: z.string().cuid(),
  id: z.string().cuid(),
});

export const updateWorkoutRequestSchema = updateWorkoutSchema;

export const updateWorkoutResponseSchema = workoutSchema;

export const deleteWorkoutParamsSchema = z.object({
  planId: z.string().cuid(),
  id: z.string().cuid(),
});
