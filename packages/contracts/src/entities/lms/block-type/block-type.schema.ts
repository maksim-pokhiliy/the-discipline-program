import { z } from "zod";

import { BLOCK_TYPE_CONSTANTS } from "./block-type.constants";

export const blockTypeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(BLOCK_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(BLOCK_TYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBlockTypeSchema = z.object({
  name: z.string().min(1).max(BLOCK_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(BLOCK_TYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable().optional(),
});

export const updateBlockTypeSchema = createBlockTypeSchema.partial();
