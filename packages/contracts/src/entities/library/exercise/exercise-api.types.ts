import { type z } from "zod";

import {
  type approveExerciseParamsSchema,
  type approveExerciseResponseSchema,
  type createExerciseRequestSchema,
  type createExerciseResponseSchema,
  type deleteExerciseParamsSchema,
  type getExerciseByIdParamsSchema,
  type getExerciseResponseSchema,
  type getExercisesQuerySchema,
  type getExercisesResponseSchema,
  type getMyExercisesResponseSchema,
  type mergeExerciseParamsSchema,
  type mergeExerciseRequestSchema,
  type mergeExerciseResponseSchema,
  type rejectExerciseParamsSchema,
  type rejectExerciseRequestSchema,
  type rejectExerciseResponseSchema,
  type updateExerciseParamsSchema,
  type updateExerciseRequestSchema,
  type updateExerciseResponseSchema,
} from "./exercise-api.schema";

export type GetExercisesQuery = z.infer<typeof getExercisesQuerySchema>;
export type GetExercisesResponse = z.infer<typeof getExercisesResponseSchema>;
export type GetMyExercisesResponse = z.infer<typeof getMyExercisesResponseSchema>;
export type GetExerciseByIdParams = z.infer<typeof getExerciseByIdParamsSchema>;
export type GetExerciseResponse = z.infer<typeof getExerciseResponseSchema>;
export type CreateExerciseRequest = z.infer<typeof createExerciseRequestSchema>;
export type CreateExerciseResponse = z.infer<typeof createExerciseResponseSchema>;
export type UpdateExerciseParams = z.infer<typeof updateExerciseParamsSchema>;
export type UpdateExerciseRequest = z.infer<typeof updateExerciseRequestSchema>;
export type UpdateExerciseResponse = z.infer<typeof updateExerciseResponseSchema>;
export type DeleteExerciseParams = z.infer<typeof deleteExerciseParamsSchema>;
export type ApproveExerciseParams = z.infer<typeof approveExerciseParamsSchema>;
export type ApproveExerciseResponse = z.infer<typeof approveExerciseResponseSchema>;
export type RejectExerciseParams = z.infer<typeof rejectExerciseParamsSchema>;
export type RejectExerciseRequest = z.infer<typeof rejectExerciseRequestSchema>;
export type RejectExerciseResponse = z.infer<typeof rejectExerciseResponseSchema>;
export type MergeExerciseParams = z.infer<typeof mergeExerciseParamsSchema>;
export type MergeExerciseRequest = z.infer<typeof mergeExerciseRequestSchema>;
export type MergeExerciseResponse = z.infer<typeof mergeExerciseResponseSchema>;
