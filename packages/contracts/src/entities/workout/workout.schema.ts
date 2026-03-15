import { z } from "zod";

export const workoutSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  scheduledDate: z.date().nullable(),
  title: z.string().max(200),
  description: z.string().nullable(),
  content: z.string().nullable(),
  sortOrder: z.number().int(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),
});

export const updateWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().nullable().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  content: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});
