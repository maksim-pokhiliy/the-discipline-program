import { z } from "zod";

import {
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
    message: "alternatives must have unique exerciseIds",
    path: ["alternatives"],
  })
  .refine((data) => altsExcludePrimary(data.alternatives, data.exerciseId), {
    message: "alternatives must not include the primary exerciseId",
    path: ["alternatives"],
  });

export const createPlanItemResponseSchema = planItemSchema;

export const updatePlanItemRequestSchema = updatePlanItemSchema;

export const updatePlanItemResponseSchema = planItemSchema;
