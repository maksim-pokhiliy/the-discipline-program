import { z } from "zod";

export const planDaySchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  date: z.date(),
  dayTypeId: z.string().cuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanDaySchema = z.object({
  planId: z.string().cuid(),
  date: z.date(),
  dayTypeId: z.string().cuid().optional(),
});

export const updatePlanDaySchema = z.object({
  dayTypeId: z.string().cuid().nullable().optional(),
});
