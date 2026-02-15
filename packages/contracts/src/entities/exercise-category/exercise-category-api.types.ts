import { type z } from "zod";

import {
  type createExerciseCategoryRequestSchema,
  type deleteExerciseCategoryParamsSchema,
  type getExerciseCategoriesResponseSchema,
  type getExerciseCategoryByIdParamsSchema,
  type updateExerciseCategoryParamsSchema,
  type updateExerciseCategoryRequestSchema,
} from "./exercise-category-api.schema";

export type GetExerciseCategoriesResponse = z.infer<typeof getExerciseCategoriesResponseSchema>;

export type GetExerciseCategoryByIdParams = z.infer<typeof getExerciseCategoryByIdParamsSchema>;

export type CreateExerciseCategoryRequest = z.infer<typeof createExerciseCategoryRequestSchema>;

export type UpdateExerciseCategoryParams = z.infer<typeof updateExerciseCategoryParamsSchema>;

export type UpdateExerciseCategoryRequest = z.infer<typeof updateExerciseCategoryRequestSchema>;

export type DeleteExerciseCategoryParams = z.infer<typeof deleteExerciseCategoryParamsSchema>;
