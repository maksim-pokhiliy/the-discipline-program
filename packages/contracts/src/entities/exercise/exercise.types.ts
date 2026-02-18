import { type z } from "zod";

import { type getExercisesPageDataResponseSchema } from "./exercise-api.schema";
import {
  type createExerciseSchema,
  type exerciseSchema,
  type updateExerciseSchema,
} from "./exercise.schema";

export type Exercise = z.infer<typeof exerciseSchema>;

export type CreateExerciseData = z.infer<typeof createExerciseSchema>;

export type UpdateExerciseData = z.infer<typeof updateExerciseSchema>;

export type AdminExercisesPageData = z.infer<typeof getExercisesPageDataResponseSchema>;
