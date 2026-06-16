import { z } from "zod";

import { COACH_NOTE_CONSTANTS } from "../coach-note";

import { ActionItemResolveReason } from "./coach-action-item.constants";
import { coachActionItemSchema } from "./coach-action-item.schema";

export const resolveActionItemParamsSchema = z.object({
  itemId: z.string().cuid(),
});

export const resolveActionItemRequestSchema = z.object({
  reason: z.literal(ActionItemResolveReason.MANUAL_CONTACTED).optional(),
  note: z.string().min(1).max(COACH_NOTE_CONSTANTS.MAX_CONTENT_LENGTH).optional(),
});

export const resolveActionItemResponseSchema = coachActionItemSchema;

export const reconcileResponseSchema = z.object({
  created: z.number().int(),
  updated: z.number().int(),
  resolved: z.number().int(),
});
