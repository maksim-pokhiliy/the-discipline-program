import { z } from "zod";

import { PlanOverrideKindEnum, PlanOverrideScopeEnum } from "./plan-override.constants";
import { planOverridePayloadSchema, planOverrideSchema } from "./plan-override.schema";

export const enrollmentOverrideParamSchema = z.object({ enrollmentId: z.string().cuid() });
export const overrideIdParamSchema = z.object({ overrideId: z.string().cuid() });

export const createPlanOverrideBodySchema = z.object({
  scope: PlanOverrideScopeEnum,
  scopeId: z.string().cuid(),
  kind: PlanOverrideKindEnum,
  payload: planOverridePayloadSchema,
  startsOnWeekIndex: z.number().int().nonnegative().optional(),
  endsOnWeekIndex: z.number().int().nonnegative().optional(),
});

export const createPlanOverrideInputSchema = z.object({
  enrollmentId: z.string().cuid(),
  scope: PlanOverrideScopeEnum,
  scopeId: z.string().cuid(),
  kind: PlanOverrideKindEnum,
  payload: planOverridePayloadSchema,
  startsOnWeekIndex: z.number().int().nonnegative().optional(),
  endsOnWeekIndex: z.number().int().nonnegative().optional(),
});

export const updatePlanOverrideInputSchema = z.object({
  scope: PlanOverrideScopeEnum.optional(),
  scopeId: z.string().cuid().optional(),
  kind: PlanOverrideKindEnum.optional(),
  payload: planOverridePayloadSchema.optional(),
  startsOnWeekIndex: z.number().int().nonnegative().nullable().optional(),
  endsOnWeekIndex: z.number().int().nonnegative().nullable().optional(),
});

export const planOverrideIdParamSchema = overrideIdParamSchema;

export const listPlanOverridesQuerySchema = z.object({
  enrollmentId: z.string().cuid().optional(),
  scope: PlanOverrideScopeEnum.optional(),
  scopeId: z.string().cuid().optional(),
});

export const listPlanOverridesResponseSchema = z.object({
  items: z.array(planOverrideSchema),
  total: z.number().int().nonnegative(),
});

export const getPlanOverrideResponseSchema = planOverrideSchema;
export const createPlanOverrideResponseSchema = planOverrideSchema;
export const updatePlanOverrideResponseSchema = planOverrideSchema;
export const listEnrollmentOverridesResponseSchema = z.array(planOverrideSchema);

const effectivePlanNodeBaseSchema = z.object({
  isOverridden: z.boolean(),
  overrideKind: z.string().nullable(),
  notes: z.array(z.string()),
  suspended: z.boolean(),
});

const effectivePlanEntrySchema = effectivePlanNodeBaseSchema.extend({
  id: z.string().cuid(),
  order: z.number().int().nonnegative(),
});

const effectivePlanBlockSegmentSchema = effectivePlanNodeBaseSchema.extend({
  id: z.string().cuid(),
  order: z.number().int().nonnegative(),
  entries: z.array(effectivePlanEntrySchema),
});

const effectivePlanBlockSchema = effectivePlanNodeBaseSchema.extend({
  id: z.string().cuid(),
  order: z.number().int().nonnegative(),
  segments: z.array(effectivePlanBlockSegmentSchema),
});

const effectivePlanSessionSchema = effectivePlanNodeBaseSchema.extend({
  id: z.string().cuid(),
  order: z.number().int().nonnegative(),
  blocks: z.array(effectivePlanBlockSchema),
});

const effectivePlanDaySchema = effectivePlanNodeBaseSchema.extend({
  id: z.string().cuid(),
  sessions: z.array(effectivePlanSessionSchema),
});

export const effectivePlanWeekSchema = effectivePlanNodeBaseSchema.extend({
  id: z.string().cuid(),
  index: z.number().int().nonnegative(),
  days: z.array(effectivePlanDaySchema),
});
