import { z } from "zod";

import {
  createWorkoutBlockSchema,
  updateWorkoutBlockSchema,
  workoutBlockSchema,
} from "./workout-block.schema";

export const getWorkoutBlocksParamsSchema = z.object({
  workoutId: z.string().cuid(),
});

export const getWorkoutBlocksResponseSchema = z.array(workoutBlockSchema);

export const getWorkoutBlockByIdParamsSchema = z.object({
  workoutId: z.string().cuid(),
  id: z.string().cuid(),
});

export const getWorkoutBlockResponseSchema = workoutBlockSchema;

export const createWorkoutBlockParamsSchema = z.object({
  workoutId: z.string().cuid(),
});

export const createWorkoutBlockRequestSchema = createWorkoutBlockSchema;

export const createWorkoutBlockResponseSchema = workoutBlockSchema;

export const updateWorkoutBlockParamsSchema = z.object({
  workoutId: z.string().cuid(),
  id: z.string().cuid(),
});

export const updateWorkoutBlockRequestSchema = updateWorkoutBlockSchema;

export const updateWorkoutBlockResponseSchema = workoutBlockSchema;

export const deleteWorkoutBlockParamsSchema = z.object({
  workoutId: z.string().cuid(),
  id: z.string().cuid(),
});

export const reorderSetsParamsSchema = z.object({
  blockId: z.string().cuid(),
});

export const reorderSetsRequestSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1),
});
