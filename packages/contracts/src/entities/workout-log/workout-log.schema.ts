import { z } from "zod";

export const workoutLogSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  workoutId: z.string().cuid(),
  date: z.date(),
  notes: z.string().nullable(),
  isRx: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createWorkoutLogSchema = z.object({
  workoutId: z.string().cuid(),
  date: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  isRx: z.boolean().optional(),
});
