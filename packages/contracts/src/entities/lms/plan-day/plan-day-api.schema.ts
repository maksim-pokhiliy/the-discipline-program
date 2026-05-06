import { z } from "zod";

import { planDaySchema } from "./plan-day.schema";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_PLAN_DAYS_RANGE_DAYS = 366;

export const planDayParamsSchema = z.object({
  planId: z.string().cuid(),
  dayId: z.string().cuid(),
});

export const planByPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const getPlanDaysQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((q) => q.from.getTime() <= q.to.getTime(), {
    message: "from must be <= to",
    path: ["from"],
  })
  .refine((q) => (q.to.getTime() - q.from.getTime()) / MS_PER_DAY <= MAX_PLAN_DAYS_RANGE_DAYS, {
    message: `range must be <= ${MAX_PLAN_DAYS_RANGE_DAYS} days`,
    path: ["to"],
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

export const updatePlanDayRequestSchema = z
  .object({
    dayTypeId: z.string().cuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "patch cannot be empty",
  });

export const updatePlanDayResponseSchema = planDaySchema;
