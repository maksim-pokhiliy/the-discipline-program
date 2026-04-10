import { z } from "zod";

import { WORKOUT_CONSTANTS } from "./workout.constants";

export const workoutSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  scheduledDate: z.date().nullable(),
  title: z.string().max(WORKOUT_CONSTANTS.MAX_TITLE_LENGTH),
  description: z.string().nullable(),
  content: z.string().nullable(),
  sortOrder: z.number().int(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().optional(),
  title: z.string().max(WORKOUT_CONSTANTS.MAX_TITLE_LENGTH).optional(),
  description: z.string().max(WORKOUT_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  content: z.string().max(WORKOUT_CONSTANTS.MAX_CONTENT_LENGTH).optional(),
});

export const updateWorkoutSchema = z.object({
  scheduledDate: z.coerce.date().nullable().optional(),
  title: z.string().max(WORKOUT_CONSTANTS.MAX_TITLE_LENGTH).optional(),
  description: z.string().max(WORKOUT_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable().optional(),
  content: z.string().max(WORKOUT_CONSTANTS.MAX_CONTENT_LENGTH).nullable().optional(),
  isArchived: z.boolean().optional(),
});
