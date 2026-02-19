import { z } from "zod";

import { exerciseCategorySchema } from "../exercise-category/exercise-category.schema";

export const workoutBlockSchema = z.object({
  id: z.string().cuid(),
  workoutId: z.string().cuid(),
  categoryId: z.string().cuid(),
  category: exerciseCategorySchema,
  rounds: z.number().int().positive().nullable(),
  timeCapSec: z.number().int().positive().nullable(),
});

export const createWorkoutBlockSchema = z.object({
  categoryId: z.string().cuid(),
  rounds: z.number().int().positive().optional(),
  timeCapSec: z.number().int().positive().optional(),
});

export const updateWorkoutBlockSchema = z.object({
  categoryId: z.string().cuid().optional(),
  rounds: z.number().int().positive().nullable().optional(),
  timeCapSec: z.number().int().positive().nullable().optional(),
});
