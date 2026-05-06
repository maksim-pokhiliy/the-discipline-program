import { z } from "zod";

import { createPlanBlockSchema, planBlockSchema, updatePlanBlockSchema } from "./plan-block.schema";

export const planBlockParamsSchema = z.object({
  planId: z.string().cuid(),
  blockId: z.string().cuid(),
});

export const planBlocksBySessionParamsSchema = z.object({
  planId: z.string().cuid(),
  sessionId: z.string().cuid(),
});

export const getPlanBlocksResponseSchema = z.object({
  blocks: z.array(planBlockSchema),
});

export const getPlanBlockResponseSchema = planBlockSchema;

export const createPlanBlockRequestSchema = createPlanBlockSchema.omit({ sessionId: true });

export const createPlanBlockResponseSchema = planBlockSchema;

export const updatePlanBlockRequestSchema = updatePlanBlockSchema.refine(
  (data) => Object.keys(data).length > 0,
  { message: "patch cannot be empty" },
);

export const updatePlanBlockResponseSchema = planBlockSchema;
