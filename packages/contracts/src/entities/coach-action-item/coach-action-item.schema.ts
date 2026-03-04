import { z } from "zod";

import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "./coach-action-item.constants";

export const actionItemTypeSchema = z.nativeEnum(ActionItemType);
export const actionItemSeveritySchema = z.nativeEnum(ActionItemSeverity);
export const actionItemStatusSchema = z.nativeEnum(ActionItemStatus);
export const actionItemResolveReasonSchema = z.nativeEnum(ActionItemResolveReason);

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
