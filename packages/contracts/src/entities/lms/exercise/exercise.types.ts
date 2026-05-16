import { type z } from "zod";

import {
  type createExerciseSchema,
  type exerciseSchema,
  type updateExerciseSchema,
} from "./exercise.schema";

export type Exercise = z.infer<typeof exerciseSchema>;

export type CreateExerciseData = z.infer<typeof createExerciseSchema>;

export type UpdateExerciseData = z.infer<typeof updateExerciseSchema>;
