import { z } from "zod";

import { planIdParamSchema } from "../../../common";

export const applyBlockTemplateInputSchema = z.object({
  kind: z.literal("block"),
  templateId: z.string().cuid(),
  target: z.object({
    sessionId: z.string().cuid(),
    order: z.number().int().nonnegative(),
  }),
});

export const applySessionTemplateInputSchema = z.object({
  kind: z.literal("session"),
  templateId: z.string().cuid(),
  target: z.object({
    dayId: z.string().cuid(),
    order: z.number().int().nonnegative(),
  }),
});

export const applyWeekTemplateInputSchema = z.object({
  kind: z.literal("week"),
  templateId: z.string().cuid(),
  target: z.object({
    index: z.number().int().nonnegative(),
  }),
});

export const applyTemplateInputSchema = z.discriminatedUnion("kind", [
  applyBlockTemplateInputSchema,
  applySessionTemplateInputSchema,
  applyWeekTemplateInputSchema,
]);

export const applyTemplateParamsSchema = planIdParamSchema;

export const applyTemplateResponseSchema = z.object({
  created: z.object({
    blockId: z.string().cuid().optional(),
    sessionId: z.string().cuid().optional(),
    weekId: z.string().cuid().optional(),
  }),
});
