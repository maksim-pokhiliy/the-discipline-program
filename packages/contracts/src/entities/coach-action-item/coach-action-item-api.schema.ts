import { z } from "zod";

import { coachActionItemSchema } from "./coach-action-item.schema";

export const resolveActionItemParamsSchema = z.object({
  itemId: z.string().cuid(),
});

export const resolveActionItemResponseSchema = coachActionItemSchema;

export const reconcileResponseSchema = z.object({
  created: z.number().int(),
  updated: z.number().int(),
  resolved: z.number().int(),
});
