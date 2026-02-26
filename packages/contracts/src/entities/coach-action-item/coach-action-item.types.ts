import { type z } from "zod";

import {
  type actionItemResolveReasonSchema,
  type actionItemSeveritySchema,
  type actionItemStatusSchema,
  type actionItemTypeSchema,
  type coachActionItemSchema,
} from "./coach-action-item.schema";

export type ActionItemType = z.infer<typeof actionItemTypeSchema>;
export type ActionItemSeverity = z.infer<typeof actionItemSeveritySchema>;
export type ActionItemStatus = z.infer<typeof actionItemStatusSchema>;
export type ActionItemResolveReason = z.infer<typeof actionItemResolveReasonSchema>;
export type CoachActionItem = z.infer<typeof coachActionItemSchema>;
