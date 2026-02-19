import { type z } from "zod";

import {
  type createWorkoutBlockParamsSchema,
  type createWorkoutBlockRequestSchema,
  type createWorkoutBlockResponseSchema,
  type deleteWorkoutBlockParamsSchema,
  type getWorkoutBlockByIdParamsSchema,
  type getWorkoutBlockResponseSchema,
  type getWorkoutBlocksParamsSchema,
  type getWorkoutBlocksResponseSchema,
  type updateWorkoutBlockParamsSchema,
  type updateWorkoutBlockRequestSchema,
  type updateWorkoutBlockResponseSchema,
} from "./workout-block-api.schema";

export type GetWorkoutBlocksParams = z.infer<typeof getWorkoutBlocksParamsSchema>;
export type GetWorkoutBlocksResponse = z.infer<typeof getWorkoutBlocksResponseSchema>;
export type GetWorkoutBlockByIdParams = z.infer<typeof getWorkoutBlockByIdParamsSchema>;
export type GetWorkoutBlockResponse = z.infer<typeof getWorkoutBlockResponseSchema>;
export type CreateWorkoutBlockParams = z.infer<typeof createWorkoutBlockParamsSchema>;
export type CreateWorkoutBlockRequest = z.infer<typeof createWorkoutBlockRequestSchema>;
export type CreateWorkoutBlockResponse = z.infer<typeof createWorkoutBlockResponseSchema>;
export type UpdateWorkoutBlockParams = z.infer<typeof updateWorkoutBlockParamsSchema>;
export type UpdateWorkoutBlockRequest = z.infer<typeof updateWorkoutBlockRequestSchema>;
export type UpdateWorkoutBlockResponse = z.infer<typeof updateWorkoutBlockResponseSchema>;
export type DeleteWorkoutBlockParams = z.infer<typeof deleteWorkoutBlockParamsSchema>;
