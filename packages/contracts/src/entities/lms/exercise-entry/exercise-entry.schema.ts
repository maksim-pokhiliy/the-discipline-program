import { z } from "zod";

import { exerciseSnapshotSchema } from "../_domain/exercise-snapshot.schema";
import { prescriptionSchema } from "../_domain/prescription.schema";

import { EXERCISE_ENTRY_CONSTANTS } from "./exercise-entry.constants";

export const exerciseEntryAlternativeSchema = z.object({
  exerciseId: z.string().cuid(),
  exerciseSnapshot: exerciseSnapshotSchema,
  prescription: prescriptionSchema,
  reason: z.string().max(EXERCISE_ENTRY_CONSTANTS.MAX_REASON_LENGTH).optional(),
});

export const exerciseEntrySchema = z.object({
  id: z.string().cuid(),
  setGroupId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  exerciseId: z.string().cuid(),
  exerciseSnapshot: exerciseSnapshotSchema,
  prescription: prescriptionSchema,
  alternatives: z
    .array(exerciseEntryAlternativeSchema)
    .max(EXERCISE_ENTRY_CONSTANTS.MAX_ALTERNATIVES),
  externalUrl: z.string().url().nullable(),
  notes: z.string().max(EXERCISE_ENTRY_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  version: z.number().int().min(1),
});
