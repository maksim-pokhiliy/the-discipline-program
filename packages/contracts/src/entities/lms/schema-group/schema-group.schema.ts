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

export const groupTrackSchema = z
  .object({
    header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
    steps: z
      .array(z.number().int().positive().max(SCHEMA_CONSTANTS.MAX_LADDER_STEP_VALUE))
      .min(1)
      .max(SCHEMA_CONSTANTS.MAX_LADDER_STEPS),
  })
  .strict();

export const createGroupRequestSchema = z
  .object({
    blockId: z.string().cuid(),
    notes: notesListSchema.nullable().optional(),
    interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS).optional(),
    tracks: z.array(groupTrackSchema).min(2).max(SCHEMA_CONSTANTS.MAX_PARALLEL_TRACKS),
  })
  .strict();

export const updateGroupRequestSchema = z
  .object({
    notes: notesListSchema.nullable().optional(),
    interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS).optional(),
  })
  .strict();
