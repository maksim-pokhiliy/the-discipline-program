import { z } from "zod";

import { planDaySchema } from "./plan-day.schema";

export const planDayParamsSchema = z.object({
  planId: z.string().cuid(),
  dayId: z.string().cuid(),
});

export const planByPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const getPlanDaysQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const getPlanDaysResponseSchema = z.object({
  days: z.array(planDaySchema),
});

export const getPlanDayResponseSchema = planDaySchema;

export const createPlanDayRequestSchema = z.object({
  date: z.coerce.date(),
  dayTypeId: z.string().cuid().nullable().optional(),
});

export const createPlanDayResponseSchema = z.object({
  day: planDaySchema,
  isNew: z.boolean(),
});

export const updatePlanDayRequestSchema = z.object({
  dayTypeId: z.string().cuid().nullable().optional(),
});

export const updatePlanDayResponseSchema = planDaySchema;
