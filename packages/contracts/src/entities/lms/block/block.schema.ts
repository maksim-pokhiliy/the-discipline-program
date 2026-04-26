import { z } from "zod";

import { blockStatusSchema } from "../_domain/block-status.schema";

import { BLOCK_CONSTANTS } from "./block.constants";

export const blockSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  kindId: z.string().cuid(),
  title: z.string().max(BLOCK_CONSTANTS.MAX_TITLE_LENGTH).nullable(),
  status: blockStatusSchema,
  weight: z.number().int().min(BLOCK_CONSTANTS.MIN_WEIGHT).max(BLOCK_CONSTANTS.MAX_WEIGHT),
  notes: z.string().max(BLOCK_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  version: z.number().int().min(1),
});
