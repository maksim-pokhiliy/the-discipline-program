import { z } from "zod";

import {
  planOverrideKindSchema,
  planOverrideSchema,
  planOverrideScopeSchema,
} from "./plan-override.schema";

export const createPlanOverrideInputSchema = z.object({
  enrollmentId: z.string().cuid(),
  scope: planOverrideScopeSchema,
  scopeId: z.string().cuid(),
  kind: planOverrideKindSchema,
  payload: z.unknown(),
  startsOnWeekIndex: z.number().int().nonnegative().optional(),
  endsOnWeekIndex: z.number().int().nonnegative().optional(),
});

export const updatePlanOverrideInputSchema = z.object({
  scope: planOverrideScopeSchema.optional(),
  scopeId: z.string().cuid().optional(),
  kind: planOverrideKindSchema.optional(),
  payload: z.unknown().optional(),
  startsOnWeekIndex: z.number().int().nonnegative().nullable().optional(),
  endsOnWeekIndex: z.number().int().nonnegative().nullable().optional(),
});

export const planOverrideIdParamSchema = z.object({ overrideId: z.string().cuid() });

export const listPlanOverridesQuerySchema = z.object({
  enrollmentId: z.string().cuid().optional(),
  scope: planOverrideScopeSchema.optional(),
  scopeId: z.string().cuid().optional(),
});

export const listPlanOverridesResponseSchema = z.object({
  items: z.array(planOverrideSchema),
  total: z.number().int().nonnegative(),
});

export const getPlanOverrideResponseSchema = planOverrideSchema;
export const createPlanOverrideResponseSchema = planOverrideSchema;
export const updatePlanOverrideResponseSchema = planOverrideSchema;
