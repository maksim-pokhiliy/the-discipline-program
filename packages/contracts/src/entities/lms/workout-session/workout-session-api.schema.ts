import { z } from "zod";

import { workoutSessionStatusSchema } from "../_domain/workout-session-status.schema";

import { WORKOUT_SESSION_CONSTANTS } from "./workout-session.constants";
import { workoutSessionSchema } from "./workout-session.schema";

export const createWorkoutSessionInputSchema = z.object({
  userId: z.string().cuid(),
  scheduledFor: z.date().optional(),
  startedAt: z.date(),
  status: workoutSessionStatusSchema.default("IN_PROGRESS"),
});

export const updateWorkoutSessionInputSchema = z.object({
  completedAt: z.date().nullable().optional(),
  durationSec: z.number().int().nonnegative().nullable().optional(),
  status: workoutSessionStatusSchema.optional(),
  perceivedExertion: z
    .number()
    .int()
    .min(WORKOUT_SESSION_CONSTANTS.MIN_RPE)
    .max(WORKOUT_SESSION_CONSTANTS.MAX_RPE)
    .nullable()
    .optional(),
  mood: z.string().max(WORKOUT_SESSION_CONSTANTS.MAX_MOOD_LENGTH).nullable().optional(),
  notes: z.string().max(WORKOUT_SESSION_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
  completionRatio: z.number().min(0).max(1).nullable().optional(),
});

export const workoutSessionIdParamSchema = z.object({
  workoutSessionId: z.string().cuid(),
});

export const listWorkoutSessionsQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  status: workoutSessionStatusSchema.optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
});

export const listWorkoutSessionsResponseSchema = z.object({
  items: z.array(workoutSessionSchema),
  total: z.number().int().nonnegative(),
});

export const getWorkoutSessionResponseSchema = workoutSessionSchema;
export const createWorkoutSessionResponseSchema = workoutSessionSchema;
export const updateWorkoutSessionResponseSchema = workoutSessionSchema;
