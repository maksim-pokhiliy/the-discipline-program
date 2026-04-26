import { type ExerciseEntry as PrismaExerciseEntry } from "@prisma/client";
import { z } from "zod";

import { exerciseSnapshotSchema, prescriptionSchema } from "@repo/contracts/lms/_domain";
import {
  EXERCISE_ENTRY_CONSTANTS,
  exerciseEntryAlternativeSchema,
  type ExerciseEntry,
} from "@repo/contracts/lms/exercise-entry";

const alternativesSchema = z
  .array(exerciseEntryAlternativeSchema)
  .max(EXERCISE_ENTRY_CONSTANTS.MAX_ALTERNATIVES);

export const mapToExerciseEntry = (e: PrismaExerciseEntry): ExerciseEntry => ({
  id: e.id,
  setGroupId: e.setGroupId,
  order: e.order,
  exerciseId: e.exerciseId,
  exerciseSnapshot: exerciseSnapshotSchema.parse(e.exerciseSnapshot),
  prescription: prescriptionSchema.parse(e.prescription),
  alternatives: alternativesSchema.parse(e.alternatives),
  externalUrl: e.externalUrl,
  notes: e.notes,
});
