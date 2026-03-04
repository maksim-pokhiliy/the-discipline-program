import { z } from "zod";

export const workoutSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  scheduledDate: z.date().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const updateWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  isArchived: z.boolean().optional(),
});
