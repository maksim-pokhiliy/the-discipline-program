import { z } from "zod";

import { notesListSchema } from "../_shared";
import { SCHEMA_CONSTANTS } from "../schema";

import { PARALLEL_INTERLEAVE_ORDERS } from "./schema-group.constants";

export const schemaGroupSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  notes: notesListSchema.nullable(),
  interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createGroupRequestSchema = z
  .object({
    blockId: z.string().cuid(),
    schemaIds: z
      .array(z.string().cuid())
      .min(2)
      .max(SCHEMA_CONSTANTS.MAX_PARALLEL_TRACKS)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "schemaIds must be unique",
      }),
    interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS).optional(),
    notes: notesListSchema.nullable().optional(),
  })
  .strict();

export const updateGroupRequestSchema = z
  .object({
    notes: notesListSchema.nullable().optional(),
    interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS).optional(),
  })
  .strict();
