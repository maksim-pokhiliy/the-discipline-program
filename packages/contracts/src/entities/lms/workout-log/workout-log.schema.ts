import { z } from "zod";

import { WORKOUT_LOG_CONSTANTS } from "./workout-log.constants";

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
  notes: z.string().max(WORKOUT_LOG_CONSTANTS.MAX_NOTES_LENGTH).optional(),
  isRx: z.boolean().optional(),
});
