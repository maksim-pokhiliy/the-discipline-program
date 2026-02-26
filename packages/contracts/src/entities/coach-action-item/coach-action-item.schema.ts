import { z } from "zod";

import {
  ACTION_ITEM_RESOLVE_REASONS,
  ACTION_ITEM_SEVERITIES,
  ACTION_ITEM_STATUSES,
  ACTION_ITEM_TYPES,
} from "./coach-action-item.constants";

export const actionItemTypeSchema = z.enum(ACTION_ITEM_TYPES);
export const actionItemSeveritySchema = z.enum(ACTION_ITEM_SEVERITIES);
export const actionItemStatusSchema = z.enum(ACTION_ITEM_STATUSES);
export const actionItemResolveReasonSchema = z.enum(ACTION_ITEM_RESOLVE_REASONS);

export const coachActionItemSchema = z.object({
  id: z.string().cuid(),
  coachId: z.string().cuid(),
  athleteId: z.string().cuid(),
  type: actionItemTypeSchema,
  severity: actionItemSeveritySchema,
  status: actionItemStatusSchema,
  message: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  resolvedAt: z.date().nullable(),
  resolveReason: actionItemResolveReasonSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
