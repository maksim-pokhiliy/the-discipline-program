import { z } from "zod";

import { notesListSchema } from "../_shared";

export const weekSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  startDate: z.coerce.date(),
  notes: notesListSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateWeekNotesSchema = z.object({
  notes: notesListSchema.nullable(),
});
