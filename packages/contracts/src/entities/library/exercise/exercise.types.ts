import { type z } from "zod";

import {
  type createExerciseSchema,
  type exerciseListItemSchema,
  type exerciseSchema,
  type mergeExerciseSchema,
  type rejectExerciseSchema,
  type updateExerciseSchema,
} from "./exercise.schema";

export type Exercise = z.infer<typeof exerciseSchema>;
export type ExerciseListItem = z.infer<typeof exerciseListItemSchema>;
export type CreateExerciseData = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseData = z.infer<typeof updateExerciseSchema>;
export type MergeExerciseData = z.infer<typeof mergeExerciseSchema>;
export type RejectExerciseData = z.infer<typeof rejectExerciseSchema>;
