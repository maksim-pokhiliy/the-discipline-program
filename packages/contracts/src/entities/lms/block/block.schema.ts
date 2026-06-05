import { z } from "zod";

import { intensitySchema, timeCapSchema } from "../_shared";
import { labelSchema } from "../label";
import { schemaWithBodySchema } from "../schema";

import { BLOCK_CONSTANTS } from "./block.constants";

export const blockSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  order: z.number().int().positive(),
  intensity: intensitySchema.nullable(),
  timeCap: timeCapSchema.nullable(),
  notes: z.string().nullable(),
  labels: z.array(labelSchema),
  schemas: z.array(schemaWithBodySchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBlockSchema = z.object({
  intensity: intensitySchema.nullable().optional(),
  timeCap: timeCapSchema.nullable().optional(),
  notes: z.string().max(BLOCK_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    })
    .optional(),
});

export const updateBlockSchema = createBlockSchema;

export const reorderBlocksSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});

export const assignBlockLabelsSchema = z.object({
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    }),
});
