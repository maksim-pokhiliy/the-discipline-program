import { type z } from "zod";

import {
  type createExerciseLibraryItemInputSchema,
  type createExerciseLibraryItemResponseSchema,
  type demoteExerciseLibraryItemInputSchema,
  type demoteExerciseLibraryItemResponseSchema,
  type exerciseLibraryItemIdParamSchema,
  type getExerciseLibraryItemResponseSchema,
  type listExerciseLibraryItemsQuerySchema,
  type listExerciseLibraryItemsResponseSchema,
  type promoteExerciseLibraryItemResponseSchema,
  type updateExerciseLibraryItemInputSchema,
  type updateExerciseLibraryItemResponseSchema,
} from "./exercise-library-item-api.schema";

export type CreateExerciseLibraryItemInput = z.infer<typeof createExerciseLibraryItemInputSchema>;
export type UpdateExerciseLibraryItemInput = z.infer<typeof updateExerciseLibraryItemInputSchema>;
export type ExerciseLibraryItemIdParam = z.infer<typeof exerciseLibraryItemIdParamSchema>;
export type ListExerciseLibraryItemsQuery = z.infer<typeof listExerciseLibraryItemsQuerySchema>;
export type ListExerciseLibraryItemsResponse = z.infer<
  typeof listExerciseLibraryItemsResponseSchema
>;
export type GetExerciseLibraryItemResponse = z.infer<typeof getExerciseLibraryItemResponseSchema>;
export type CreateExerciseLibraryItemResponse = z.infer<
  typeof createExerciseLibraryItemResponseSchema
>;
export type UpdateExerciseLibraryItemResponse = z.infer<
  typeof updateExerciseLibraryItemResponseSchema
>;
export type PromoteExerciseLibraryItemResponse = z.infer<
  typeof promoteExerciseLibraryItemResponseSchema
>;
export type DemoteExerciseLibraryItemInput = z.infer<typeof demoteExerciseLibraryItemInputSchema>;
export type DemoteExerciseLibraryItemResponse = z.infer<
  typeof demoteExerciseLibraryItemResponseSchema
>;
