import { type z } from "zod";

import {
  type assignBlockLabelsRequestSchema,
  type assignBlockLabelsResponseSchema,
  type blockByIdParamsSchema,
  type blockBySessionParamsSchema,
  type createBlockRequestSchema,
  type createBlockResponseSchema,
  type duplicateBlockRequestSchema,
  type duplicateBlockResponseSchema,
  type reorderBlocksRequestSchema,
  type reorderBlocksResponseSchema,
  type updateBlockRequestSchema,
  type updateBlockResponseSchema,
} from "./block-api.schema";

export type BlockBySessionParams = z.infer<typeof blockBySessionParamsSchema>;
export type BlockByIdParams = z.infer<typeof blockByIdParamsSchema>;
export type CreateBlockRequest = z.infer<typeof createBlockRequestSchema>;
export type CreateBlockResponse = z.infer<typeof createBlockResponseSchema>;
export type UpdateBlockRequest = z.infer<typeof updateBlockRequestSchema>;
export type UpdateBlockResponse = z.infer<typeof updateBlockResponseSchema>;
export type ReorderBlocksRequest = z.infer<typeof reorderBlocksRequestSchema>;
export type ReorderBlocksResponse = z.infer<typeof reorderBlocksResponseSchema>;
export type AssignBlockLabelsRequest = z.infer<typeof assignBlockLabelsRequestSchema>;
export type AssignBlockLabelsResponse = z.infer<typeof assignBlockLabelsResponseSchema>;
export type DuplicateBlockRequest = z.infer<typeof duplicateBlockRequestSchema>;
export type DuplicateBlockResponse = z.infer<typeof duplicateBlockResponseSchema>;
