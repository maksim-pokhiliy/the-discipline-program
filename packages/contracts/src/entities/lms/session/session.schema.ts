import { z } from "zod";

import { SESSION_CONSTANTS } from "./session.constants";

export const sessionSchema = z.object({
  id: z.string().cuid(),
  dayId: z.string().cuid(),
  order: z.number().int().positive(),
  labelId: z.string().cuid().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSessionSchema = z.object({
  labelId: z.string().cuid().nullable().optional(),
  notes: z.string().max(SESSION_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
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
