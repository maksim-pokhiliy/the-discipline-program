import { z } from "zod";

import { dayOfWeekSchema } from "../_shared";

import { daySlotSchema, updateDayLabelSchema, updateDayNotesSchema } from "./day.schema";

export const dayByAddressParamsSchema = z.object({
  planId: z.string().cuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: dayOfWeekSchema,
});

export const updateDayLabelRequestSchema = updateDayLabelSchema;
export const updateDayLabelResponseSchema = daySlotSchema;

export const updateDayNotesRequestSchema = updateDayNotesSchema;
export const updateDayNotesResponseSchema = daySlotSchema;
