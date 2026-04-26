import { z } from "zod";

import { blockStatusSchema } from "../_domain/block-status.schema";

import { BLOCK_CONSTANTS } from "./block.constants";
import { blockSchema } from "./block.schema";

export const createBlockInputSchema = z.object({
  sessionId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  kindId: z.string().cuid(),
  title: z.string().max(BLOCK_CONSTANTS.MAX_TITLE_LENGTH).optional(),
  status: blockStatusSchema.default("ACTIVE"),
  weight: z
    .number()
    .int()
    .min(BLOCK_CONSTANTS.MIN_WEIGHT)
    .max(BLOCK_CONSTANTS.MAX_WEIGHT)
    .default(1),
  notes: z.string().max(BLOCK_CONSTANTS.MAX_NOTES_LENGTH).optional(),
});

export const updateBlockInputSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  order: z.number().int().nonnegative(),
  kindId: z.string().cuid(),
  title: z.string().max(BLOCK_CONSTANTS.MAX_TITLE_LENGTH).nullable(),
  status: blockStatusSchema,
  weight: z.number().int().min(BLOCK_CONSTANTS.MIN_WEIGHT).max(BLOCK_CONSTANTS.MAX_WEIGHT),
  notes: z.string().max(BLOCK_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});

export const moveBlockInputSchema = z.object({
  targetSessionId: z.string().cuid(),
  targetOrder: z.number().int().nonnegative(),
});

export const blockIdParamSchema = z.object({ blockId: z.string().cuid() });

export const getBlockResponseSchema = blockSchema;
export const createBlockResponseSchema = blockSchema;
export const updateBlockResponseSchema = blockSchema;
export const moveBlockResponseSchema = blockSchema;
