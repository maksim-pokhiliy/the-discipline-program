import { z } from "zod";

import { exerciseCategorySchema } from "../exercise-category/exercise-category.schema";

export const exerciseSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  videoUrl: z.string().url().nullable(),
  categoryId: z.string().cuid().nullable(),
  category: exerciseCategorySchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  videoUrl: z.string().url().or(z.literal("")).optional(),
  categoryId: z.string().cuid(),
});

export const updateExerciseSchema = createExerciseSchema.partial();
