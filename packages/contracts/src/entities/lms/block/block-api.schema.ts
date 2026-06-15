import { z } from "zod";

import {
  assignBlockLabelsSchema,
  blockSchema,
  createBlockSchema,
  reorderBlocksSchema,
  updateBlockSchema,
} from "./block.schema";

export const blockBySessionParamsSchema = z.object({
  planId: z.string().cuid(),
  sessionId: z.string().cuid(),
});

export const blockByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  blockId: z.string().cuid(),
});

export const createBlockRequestSchema = createBlockSchema;
export const createBlockResponseSchema = blockSchema;

export const updateBlockRequestSchema = updateBlockSchema;
export const updateBlockResponseSchema = blockSchema;

export const reorderBlocksRequestSchema = reorderBlocksSchema;
export const reorderBlocksResponseSchema = z.object({
  blocks: z.array(blockSchema),
});

export const assignBlockLabelsRequestSchema = assignBlockLabelsSchema;
export const assignBlockLabelsResponseSchema = blockSchema;

export const duplicateBlockRequestSchema = z.object({}).strict();
export const duplicateBlockResponseSchema = blockSchema;
