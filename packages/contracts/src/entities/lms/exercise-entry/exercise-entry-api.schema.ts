import { z } from "zod";

import { exerciseSnapshotSchema } from "../_domain/exercise-snapshot.schema";
import { prescriptionSchema } from "../_domain/prescription.schema";

import { EXERCISE_ENTRY_CONSTANTS } from "./exercise-entry.constants";
import { exerciseEntryAlternativeSchema, exerciseEntrySchema } from "./exercise-entry.schema";

export const createExerciseEntryInputSchema = z.object({
  setGroupId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  exerciseId: z.string().cuid(),
  exerciseSnapshot: exerciseSnapshotSchema,
  prescription: prescriptionSchema,
  alternatives: z
    .array(exerciseEntryAlternativeSchema)
    .max(EXERCISE_ENTRY_CONSTANTS.MAX_ALTERNATIVES)
    .default([]),
  externalUrl: z.string().url().optional(),
  notes: z.string().max(EXERCISE_ENTRY_CONSTANTS.MAX_NOTES_LENGTH).optional(),
});

export const updateExerciseEntryInputSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  order: z.number().int().nonnegative(),
  exerciseId: z.string().cuid(),
  exerciseSnapshot: exerciseSnapshotSchema,
  prescription: prescriptionSchema,
  alternatives: z
    .array(exerciseEntryAlternativeSchema)
    .max(EXERCISE_ENTRY_CONSTANTS.MAX_ALTERNATIVES),
  externalUrl: z.string().url().nullable(),
  notes: z.string().max(EXERCISE_ENTRY_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});

export const exerciseEntryIdParamSchema = z.object({ entryId: z.string().cuid() });

export const getExerciseEntryResponseSchema = exerciseEntrySchema;
export const createExerciseEntryResponseSchema = exerciseEntrySchema;
export const updateExerciseEntryResponseSchema = exerciseEntrySchema;
