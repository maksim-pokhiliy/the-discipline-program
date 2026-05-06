import { z } from "zod";

import {
  ALTERNATIVES_NO_PRIMARY_MESSAGE,
  ALTERNATIVES_UNIQUE_MESSAGE,
  altsExcludePrimary,
  createPlanItemBaseSchema,
  hasUniqueAlternativeIds,
  planItemSchema,
  updatePlanItemSchema,
} from "./plan-item.schema";

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

export const createPlanItemRequestSchema = createPlanItemBaseSchema
  .omit({ blockId: true })
  .refine((data) => hasUniqueAlternativeIds(data.alternatives), {
    message: ALTERNATIVES_UNIQUE_MESSAGE,
    path: ["alternatives"],
  })
  .refine((data) => altsExcludePrimary(data.alternatives, data.exerciseId), {
    message: ALTERNATIVES_NO_PRIMARY_MESSAGE,
    path: ["alternatives"],
  });

export const createPlanItemResponseSchema = planItemSchema;

export const updatePlanItemRequestSchema = updatePlanItemSchema;

export const updatePlanItemResponseSchema = planItemSchema;
