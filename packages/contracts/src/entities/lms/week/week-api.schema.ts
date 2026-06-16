import { z } from "zod";

import { daySlotSchema } from "../day";

import { updateWeekNotesSchema, weekSchema } from "./week.schema";

export const weekByPlanAndDateParamsSchema = z.object({
  planId: z.string().cuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getWeekResponseSchema = z.object({
  week: weekSchema.nullable(),
  days: z.array(daySlotSchema).length(7),
});

export const updateWeekNotesRequestSchema = updateWeekNotesSchema;

export const updateWeekNotesResponseSchema = weekSchema;

export const cloneWeekFromRequestSchema = z.object({
  sourceStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const cloneWeekResponseSchema = z.discriminatedUnion("cloned", [
  z.object({ cloned: z.literal(true), week: weekSchema }),
  z.object({ cloned: z.literal(false), reason: z.literal("empty-source") }),
]);

export const listPopulatedWeeksParamsSchema = z.object({ planId: z.string().cuid() });

export const populatedWeekSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionCount: z.number().int().nonnegative(),
  dayCount: z.number().int().nonnegative(),
});

export const populatedWeeksResponseSchema = z.object({
  weeks: z.array(populatedWeekSchema),
});
