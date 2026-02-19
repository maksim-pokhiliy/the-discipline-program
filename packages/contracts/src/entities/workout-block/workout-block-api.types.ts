import { type z } from "zod";

import {
  type createWorkoutBlockParamsSchema,
  type createWorkoutBlockRequestSchema,
  type deleteWorkoutBlockParamsSchema,
  type getWorkoutBlockByIdParamsSchema,
  type getWorkoutBlockResponseSchema,
  type getWorkoutBlocksParamsSchema,
  type getWorkoutBlocksResponseSchema,
  type updateWorkoutBlockParamsSchema,
  type updateWorkoutBlockRequestSchema,
} from "./workout-block-api.schema";

export type GetWorkoutBlocksParams = z.infer<typeof getWorkoutBlocksParamsSchema>;
export type GetWorkoutBlocksResponse = z.infer<typeof getWorkoutBlocksResponseSchema>;
export type GetWorkoutBlockByIdParams = z.infer<typeof getWorkoutBlockByIdParamsSchema>;
export type GetWorkoutBlockResponse = z.infer<typeof getWorkoutBlockResponseSchema>;
export type CreateWorkoutBlockParams = z.infer<typeof createWorkoutBlockParamsSchema>;
export type CreateWorkoutBlockRequest = z.infer<typeof createWorkoutBlockRequestSchema>;
export type UpdateWorkoutBlockParams = z.infer<typeof updateWorkoutBlockParamsSchema>;
export type UpdateWorkoutBlockRequest = z.infer<typeof updateWorkoutBlockRequestSchema>;
export type DeleteWorkoutBlockParams = z.infer<typeof deleteWorkoutBlockParamsSchema>;
