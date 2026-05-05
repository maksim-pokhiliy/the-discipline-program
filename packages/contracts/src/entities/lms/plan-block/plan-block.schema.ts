import { z } from "zod";

import { schemeParamsSchema } from "../_domain/scheme-archetype.schema";

import { PLAN_BLOCK_CONSTANTS } from "./plan-block.constants";

export const planBlockSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  schemeTypeId: z.string().cuid(),
  blockTypeIds: z
    .array(z.string().cuid())
    .min(PLAN_BLOCK_CONSTANTS.MIN_BLOCK_TYPES)
    .max(PLAN_BLOCK_CONSTANTS.MAX_BLOCK_TYPES),
  schemeParams: schemeParamsSchema,
  modifiers: z.unknown().nullable(),
  notes: z.string().max(PLAN_BLOCK_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanBlockSchema = z.object({
  sessionId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  schemeTypeId: z.string().cuid(),
  blockTypeIds: z
    .array(z.string().cuid())
    .min(PLAN_BLOCK_CONSTANTS.MIN_BLOCK_TYPES)
    .max(PLAN_BLOCK_CONSTANTS.MAX_BLOCK_TYPES),
  schemeParams: schemeParamsSchema,
  modifiers: z.unknown().optional(),
  notes: z.string().max(PLAN_BLOCK_CONSTANTS.MAX_NOTES_LENGTH).optional(),
});

export const updatePlanBlockSchema = z.object({
  order: z.number().int().nonnegative().optional(),
  schemeTypeId: z.string().cuid().optional(),
  blockTypeIds: z
    .array(z.string().cuid())
    .min(PLAN_BLOCK_CONSTANTS.MIN_BLOCK_TYPES)
    .max(PLAN_BLOCK_CONSTANTS.MAX_BLOCK_TYPES)
    .optional(),
  schemeParams: schemeParamsSchema.optional(),
  modifiers: z.unknown().nullable().optional(),
  notes: z.string().max(PLAN_BLOCK_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});
