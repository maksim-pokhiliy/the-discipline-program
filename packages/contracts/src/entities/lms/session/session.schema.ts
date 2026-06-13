import { z } from "zod";

import { notesListSchema } from "../_shared";

export const sessionSchema = z.object({
  id: z.string().cuid(),
  dayId: z.string().cuid(),
  order: z.number().int().positive(),
  labelId: z.string().cuid().nullable(),
  notes: notesListSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSessionSchema = z.object({
  labelId: z.string().cuid().nullable().optional(),
  notes: notesListSchema.nullable().optional(),
});

export const updateSessionSchema = createSessionSchema;

export const reorderSessionsSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
