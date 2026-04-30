import { type z } from "zod";

import {
  type blockIdParamSchema,
  type createBlockInputSchema,
  type createBlockResponseSchema,
  type getBlockResponseSchema,
  type moveBlockInputSchema,
  type moveBlockResponseSchema,
  type updateBlockInputSchema,
  type updateBlockResponseSchema,
} from "./block-api.schema";

export type CreateBlockInput = z.infer<typeof createBlockInputSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockInputSchema>;
export type MoveBlockInput = z.infer<typeof moveBlockInputSchema>;
export type BlockIdParam = z.infer<typeof blockIdParamSchema>;
export type GetBlockResponse = z.infer<typeof getBlockResponseSchema>;
export type CreateBlockResponse = z.infer<typeof createBlockResponseSchema>;
export type UpdateBlockResponse = z.infer<typeof updateBlockResponseSchema>;
export type MoveBlockResponse = z.infer<typeof moveBlockResponseSchema>;
