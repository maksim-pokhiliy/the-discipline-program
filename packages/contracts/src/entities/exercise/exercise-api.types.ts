import { type z } from "zod";

import {
  type createExerciseRequestSchema,
  type deleteExerciseParamsSchema,
  type getExerciseByIdParamsSchema,
  type getExercisesPageDataResponseSchema,
  type getExercisesResponseSchema,
  type getExerciseStatsResponseSchema,
  type updateExerciseParamsSchema,
  type updateExerciseRequestSchema,
} from "./exercise-api.schema";

export type GetExercisesResponse = z.infer<typeof getExercisesResponseSchema>;

export type GetExerciseByIdParams = z.infer<typeof getExerciseByIdParamsSchema>;

export type CreateExerciseRequest = z.infer<typeof createExerciseRequestSchema>;

export type UpdateExerciseParams = z.infer<typeof updateExerciseParamsSchema>;

export type UpdateExerciseRequest = z.infer<typeof updateExerciseRequestSchema>;

export type DeleteExerciseParams = z.infer<typeof deleteExerciseParamsSchema>;

export type GetExerciseStatsResponse = z.infer<typeof getExerciseStatsResponseSchema>;

export type GetExercisesPageDataResponse = z.infer<typeof getExercisesPageDataResponseSchema>;
