import { type z } from "zod";

import {
  type createExerciseCategorySchema,
  type exerciseCategorySchema,
  type updateExerciseCategorySchema,
} from "./exercise-category.schema";

export type ExerciseCategory = z.infer<typeof exerciseCategorySchema>;

export type CreateExerciseCategoryData = z.infer<typeof createExerciseCategorySchema>;

export type UpdateExerciseCategoryData = z.infer<typeof updateExerciseCategorySchema>;
