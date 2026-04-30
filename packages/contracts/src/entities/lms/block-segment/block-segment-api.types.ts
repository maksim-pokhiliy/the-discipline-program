import { type z } from "zod";

import {
  type blockSegmentIdParamSchema,
  type createBlockSegmentInputSchema,
  type createBlockSegmentResponseSchema,
  type getBlockSegmentResponseSchema,
  type updateBlockSegmentInputSchema,
  type updateBlockSegmentResponseSchema,
} from "./block-segment-api.schema";

export type CreateBlockSegmentInput = z.infer<typeof createBlockSegmentInputSchema>;
export type UpdateBlockSegmentInput = z.infer<typeof updateBlockSegmentInputSchema>;
export type BlockSegmentIdParam = z.infer<typeof blockSegmentIdParamSchema>;
export type GetBlockSegmentResponse = z.infer<typeof getBlockSegmentResponseSchema>;
export type CreateBlockSegmentResponse = z.infer<typeof createBlockSegmentResponseSchema>;
export type UpdateBlockSegmentResponse = z.infer<typeof updateBlockSegmentResponseSchema>;
