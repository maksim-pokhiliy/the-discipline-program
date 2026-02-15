import { z } from "zod";

import { exerciseCategorySchema } from "../exercise-category/exercise-category.schema";

import { createExerciseSchema, exerciseSchema, updateExerciseSchema } from "./exercise.schema";

export const getExercisesResponseSchema = z.array(exerciseSchema);

export const getExerciseByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createExerciseRequestSchema = createExerciseSchema;

export const updateExerciseParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateExerciseRequestSchema = updateExerciseSchema;

export const deleteExerciseParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getExerciseStatsResponseSchema = z.object({
  total: z.number(),
  categorized: z.number(),
  uncategorized: z.number(),
});

export const getExercisesPageDataResponseSchema = z.object({
  stats: getExerciseStatsResponseSchema,
  exercises: getExercisesResponseSchema,
  categories: z.array(exerciseCategorySchema),
});
