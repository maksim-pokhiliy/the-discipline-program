import { z } from "zod";

export const workoutSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  dayOrder: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createWorkoutSchema = z.object({
  dayOrder: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const updateWorkoutSchema = z.object({
  dayOrder: z.number().int().positive().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  isArchived: z.boolean().optional(),
});
