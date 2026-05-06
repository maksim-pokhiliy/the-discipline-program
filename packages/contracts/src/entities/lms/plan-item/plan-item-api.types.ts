import { type z } from "zod";

import {
  type createPlanItemRequestSchema,
  type createPlanItemResponseSchema,
  type getPlanItemResponseSchema,
  type getPlanItemsResponseSchema,
  type planItemParamsSchema,
  type planItemsByBlockParamsSchema,
  type updatePlanItemRequestSchema,
  type updatePlanItemResponseSchema,
} from "./plan-item-api.schema";

export type PlanItemParams = z.infer<typeof planItemParamsSchema>;
export type PlanItemsByBlockParams = z.infer<typeof planItemsByBlockParamsSchema>;
export type GetPlanItemsResponse = z.infer<typeof getPlanItemsResponseSchema>;
export type GetPlanItemResponse = z.infer<typeof getPlanItemResponseSchema>;
export type CreatePlanItemRequest = z.infer<typeof createPlanItemRequestSchema>;
export type CreatePlanItemResponse = z.infer<typeof createPlanItemResponseSchema>;
export type UpdatePlanItemRequest = z.infer<typeof updatePlanItemRequestSchema>;
export type UpdatePlanItemResponse = z.infer<typeof updatePlanItemResponseSchema>;
