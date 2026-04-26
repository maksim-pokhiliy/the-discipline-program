import { z } from "zod";

import { exerciseSnapshotSchema } from "../_domain/exercise-snapshot.schema";
import { rxStatusSchema } from "../_domain/rx-status.schema";

import { EXERCISE_LOG_CONSTANTS } from "./exercise-log.constants";

export const exerciseLogSchema = z.object({
  id: z.string().cuid(),
  blockSessionId: z.string().cuid(),
  sourceEntryId: z.string().cuid().nullable(),
  order: z.number().int().nonnegative(),
  exerciseId: z.string().cuid(),
  exerciseSnapshot: exerciseSnapshotSchema,
  rxStatus: rxStatusSchema,
  substituteExerciseId: z.string().cuid().nullable(),
  notes: z.string().max(EXERCISE_LOG_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});
