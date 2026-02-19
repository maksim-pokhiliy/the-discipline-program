import { z } from "zod";

export const setLogSchema = z.object({
  id: z.string().cuid(),
  workoutLogId: z.string().cuid(),
  prescribedSetId: z.string().cuid().nullable(),
  substitutionExerciseId: z.string().cuid().nullable(),
  repsDone: z.number().int().positive(),
  weightDone: z.number().nullable(),
  rpeActual: z.number().int().min(1).max(10).nullable(),
});

export const workoutLogSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  workoutId: z.string().cuid(),
  date: z.date(),
  notes: z.string().nullable(),
  isRx: z.boolean(),
  setLogs: z.array(setLogSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSetLogSchema = z.object({
  prescribedSetId: z.string().cuid().optional(),
  substitutionExerciseId: z.string().cuid().optional(),
  repsDone: z.number().int().positive(),
  weightDone: z.number().positive().optional(),
  rpeActual: z.number().int().min(1).max(10).optional(),
});

export const createWorkoutLogSchema = z.object({
  workoutId: z.string().cuid(),
  date: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  isRx: z.boolean().optional(),
  setLogs: z.array(createSetLogSchema).min(1),
});
