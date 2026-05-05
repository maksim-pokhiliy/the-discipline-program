import { z } from "zod";

import { workoutSessionStatusSchema } from "../_domain/workout-session-status.schema";

import { WORKOUT_SESSION_CONSTANTS } from "./workout-session.constants";

export const workoutSessionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  planSessionId: z.string().cuid().nullable(),
  scheduledDate: z.date().nullable(),
  startedAt: z.date(),
  completedAt: z.date().nullable(),
  durationSec: z.number().int().nonnegative().nullable(),
  status: workoutSessionStatusSchema,
  perceivedExertion: z
    .number()
    .int()
    .min(WORKOUT_SESSION_CONSTANTS.MIN_RPE)
    .max(WORKOUT_SESSION_CONSTANTS.MAX_RPE)
    .nullable(),
  mood: z.string().max(WORKOUT_SESSION_CONSTANTS.MAX_MOOD_LENGTH).nullable(),
  notes: z.string().max(WORKOUT_SESSION_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  completionRatio: z.number().min(0).max(1).nullable(),
});
