import { type z } from "zod";

import {
  type reconcileResponseSchema,
  type resolveActionItemParamsSchema,
  type resolveActionItemRequestSchema,
  type resolveActionItemResponseSchema,
} from "./coach-action-item-api.schema";

export type ResolveActionItemParams = z.infer<typeof resolveActionItemParamsSchema>;
export type ResolveActionItemRequest = z.infer<typeof resolveActionItemRequestSchema>;
export type ResolveActionItemResponse = z.infer<typeof resolveActionItemResponseSchema>;
export type ReconcileResponse = z.infer<typeof reconcileResponseSchema>;
