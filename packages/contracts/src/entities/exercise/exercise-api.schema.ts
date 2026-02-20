import { z } from "zod";

import { exerciseCategorySchema } from "../exercise-category/exercise-category.schema";

import { createExerciseSchema, exerciseSchema, updateExerciseSchema } from "./exercise.schema";

export const getExercisesResponseSchema = z.array(exerciseSchema);

export const getExerciseByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getExerciseResponseSchema = exerciseSchema;

export const createExerciseRequestSchema = createExerciseSchema;

export const updateExerciseParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateExerciseRequestSchema = updateExerciseSchema;

export const deleteExerciseParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getExercisesPageDataResponseSchema = z.object({
  exercises: getExercisesResponseSchema,
  categories: z.array(exerciseCategorySchema),
});
