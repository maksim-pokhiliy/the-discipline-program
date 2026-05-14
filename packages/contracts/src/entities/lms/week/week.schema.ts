import { z } from "zod";

import { WEEK_CONSTANTS } from "./week.constants";

export const weekSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  startDate: z.coerce.date(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateWeekNotesSchema = z.object({
  notes: z.string().max(WEEK_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});
