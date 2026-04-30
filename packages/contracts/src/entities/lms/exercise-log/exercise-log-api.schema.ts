import { z } from "zod";

import { exerciseSnapshotSchema } from "../_domain/exercise-snapshot.schema";
import { rxStatusSchema } from "../_domain/rx-status.schema";

import { EXERCISE_LOG_CONSTANTS } from "./exercise-log.constants";
import { exerciseLogSchema } from "./exercise-log.schema";

export const createExerciseLogInputSchema = z.object({
  blockSessionId: z.string().cuid(),
  sourceEntryId: z.string().cuid().optional(),
  order: z.number().int().nonnegative(),
  exerciseId: z.string().cuid(),
  exerciseSnapshot: exerciseSnapshotSchema,
  rxStatus: rxStatusSchema.default("RX"),
  substituteExerciseId: z.string().cuid().optional(),
  notes: z.string().max(EXERCISE_LOG_CONSTANTS.MAX_NOTES_LENGTH).optional(),
});

export const updateExerciseLogInputSchema = z.object({
  rxStatus: rxStatusSchema.optional(),
  substituteExerciseId: z.string().cuid().nullable().optional(),
  notes: z.string().max(EXERCISE_LOG_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const exerciseLogIdParamSchema = z.object({ exerciseLogId: z.string().cuid() });

export const listExerciseLogsQuerySchema = z.object({
  blockSessionId: z.string().cuid().optional(),
  exerciseId: z.string().cuid().optional(),
});

export const listExerciseLogsResponseSchema = z.object({
  items: z.array(exerciseLogSchema),
  total: z.number().int().nonnegative(),
});

export const getExerciseLogResponseSchema = exerciseLogSchema;
export const createExerciseLogResponseSchema = exerciseLogSchema;
export const updateExerciseLogResponseSchema = exerciseLogSchema;
