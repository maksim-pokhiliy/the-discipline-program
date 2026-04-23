import { z } from "zod";

import { BLOCK_TYPE_CONSTANTS } from "./block-type.constants";

export const blockTypeSchema = z.object({
  id: z.string().cuid(),
  slug: z.string().min(1).max(BLOCK_TYPE_CONSTANTS.MAX_SLUG_LENGTH),
  name: z.string().min(1).max(BLOCK_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(BLOCK_TYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  iconKey: z.string().max(BLOCK_TYPE_CONSTANTS.MAX_ICON_KEY_LENGTH).nullable(),
  colorKey: z.string().max(BLOCK_TYPE_CONSTANTS.MAX_COLOR_KEY_LENGTH).nullable(),
  sortOrder: z.number().int(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBlockTypeSchema = z.object({
  slug: z.string().min(1).max(BLOCK_TYPE_CONSTANTS.MAX_SLUG_LENGTH),
  name: z.string().min(1).max(BLOCK_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(BLOCK_TYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  iconKey: z.string().max(BLOCK_TYPE_CONSTANTS.MAX_ICON_KEY_LENGTH).optional(),
  colorKey: z.string().max(BLOCK_TYPE_CONSTANTS.MAX_COLOR_KEY_LENGTH).optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const updateBlockTypeSchema = createBlockTypeSchema.partial();
