import { z } from "zod";

export const exerciseCategorySchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createExerciseCategorySchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateExerciseCategorySchema = createExerciseCategorySchema.partial();
