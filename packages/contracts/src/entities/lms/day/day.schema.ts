import { z } from "zod";

import { dayOfWeekSchema, notesListSchema } from "../_shared";
import { blockSchema } from "../block";
import { labelSchema } from "../label";
import { sessionSchema } from "../session";

export const sessionWithLabelSchema = sessionSchema.extend({
  label: labelSchema.nullable(),
  blocks: z.array(blockSchema),
});

export const daySlotSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  label: labelSchema.nullable(),
  notes: notesListSchema.nullable(),
  sessions: z.array(sessionWithLabelSchema),
});

export const updateDayLabelSchema = z.object({
  labelId: z.string().cuid().nullable(),
});

export const updateDayNotesSchema = z.object({
  notes: notesListSchema.nullable(),
});
