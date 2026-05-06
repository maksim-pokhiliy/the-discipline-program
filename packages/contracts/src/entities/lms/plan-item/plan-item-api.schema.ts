import { z } from "zod";

import { createPlanItemSchema, planItemSchema, updatePlanItemSchema } from "./plan-item.schema";

export const planItemParamsSchema = z.object({
  planId: z.string().cuid(),
  itemId: z.string().cuid(),
});

export const planItemsByBlockParamsSchema = z.object({
  planId: z.string().cuid(),
  blockId: z.string().cuid(),
});

export const getPlanItemsResponseSchema = z.object({
  items: z.array(planItemSchema),
});

export const getPlanItemResponseSchema = planItemSchema;

export const createPlanItemRequestSchema = createPlanItemSchema.omit({ blockId: true });

export const createPlanItemResponseSchema = planItemSchema;

export const updatePlanItemRequestSchema = updatePlanItemSchema;

export const updatePlanItemResponseSchema = planItemSchema;
