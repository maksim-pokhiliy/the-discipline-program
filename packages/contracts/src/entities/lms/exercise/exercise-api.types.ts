import { type z } from "zod";

import {
  type createExerciseRequestSchema,
  type createExerciseResponseSchema,
  type deleteExerciseParamsSchema,
  type getExerciseByIdParamsSchema,
  type getExerciseResponseSchema,
  type getExercisesPageDataResponseSchema,
  type getExercisesResponseSchema,
  type updateExerciseParamsSchema,
  type updateExerciseRequestSchema,
  type updateExerciseResponseSchema,
} from "./exercise-api.schema";

export type GetExercisesResponse = z.infer<typeof getExercisesResponseSchema>;

export type GetExerciseByIdParams = z.infer<typeof getExerciseByIdParamsSchema>;

export type GetExerciseResponse = z.infer<typeof getExerciseResponseSchema>;

export type CreateExerciseRequest = z.infer<typeof createExerciseRequestSchema>;

export type CreateExerciseResponse = z.infer<typeof createExerciseResponseSchema>;

export type UpdateExerciseParams = z.infer<typeof updateExerciseParamsSchema>;

export type UpdateExerciseRequest = z.infer<typeof updateExerciseRequestSchema>;

export type UpdateExerciseResponse = z.infer<typeof updateExerciseResponseSchema>;

export type DeleteExerciseParams = z.infer<typeof deleteExerciseParamsSchema>;

export type GetExercisesPageDataResponse = z.infer<typeof getExercisesPageDataResponseSchema>;

export type AdminExercisesPageData = GetExercisesPageDataResponse;
