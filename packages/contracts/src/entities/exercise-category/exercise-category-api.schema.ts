import { z } from "zod";

import {
  createExerciseCategorySchema,
  exerciseCategorySchema,
  updateExerciseCategorySchema,
} from "./exercise-category.schema";

export const getExerciseCategoriesResponseSchema = z.array(exerciseCategorySchema);

export const getExerciseCategoryByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createExerciseCategoryRequestSchema = createExerciseCategorySchema;

export const updateExerciseCategoryParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateExerciseCategoryRequestSchema = updateExerciseCategorySchema;

export const deleteExerciseCategoryParamsSchema = z.object({
  id: z.string().cuid(),
});
