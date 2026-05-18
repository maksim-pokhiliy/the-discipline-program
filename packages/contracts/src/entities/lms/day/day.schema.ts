import { z } from "zod";

import { dayOfWeekSchema } from "../_shared";
import { blockSchema } from "../block";
import { labelSchema } from "../label";
import { sessionSchema } from "../session";

import { DAY_CONSTANTS } from "./day.constants";

export const sessionWithLabelSchema = sessionSchema.extend({
  label: labelSchema.nullable(),
  blocks: z.array(blockSchema),
});

export const daySlotSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  label: labelSchema.nullable(),
  notes: z.string().nullable(),
  sessions: z.array(sessionWithLabelSchema),
});

export const updateDayLabelSchema = z.object({
  labelId: z.string().cuid().nullable(),
});

export const updateDayNotesSchema = z.object({
  notes: z.string().max(DAY_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});
