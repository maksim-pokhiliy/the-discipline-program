import { type z } from "zod";

import {
  type createExerciseEntryInputSchema,
  type createExerciseEntryResponseSchema,
  type exerciseEntryIdParamSchema,
  type getExerciseEntryResponseSchema,
  type updateExerciseEntryInputSchema,
  type updateExerciseEntryResponseSchema,
} from "./exercise-entry-api.schema";

export type CreateExerciseEntryInput = z.infer<typeof createExerciseEntryInputSchema>;
export type UpdateExerciseEntryInput = z.infer<typeof updateExerciseEntryInputSchema>;
export type ExerciseEntryIdParam = z.infer<typeof exerciseEntryIdParamSchema>;
export type GetExerciseEntryResponse = z.infer<typeof getExerciseEntryResponseSchema>;
export type CreateExerciseEntryResponse = z.infer<typeof createExerciseEntryResponseSchema>;
export type UpdateExerciseEntryResponse = z.infer<typeof updateExerciseEntryResponseSchema>;
