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
