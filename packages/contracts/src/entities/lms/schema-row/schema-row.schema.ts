import { z } from "zod";

import {
  loadSchema,
  mediaReferenceSchema,
  notesListSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  tempoModifierSchema,
} from "../_shared";
import { modifierRefSchema } from "../modifier";

import { SCHEMA_ROW_CONSTANTS } from "./schema-row.constants";

export const schemaRowSchema = z.object({
  id: z.string().cuid(),
  schemaId: z.string().cuid(),
  order: z.number().int().positive(),
  exerciseId: z.string().cuid(),
  sets: z.number().int().positive().nullable(),
  rowGroupId: z.string().cuid().nullable(),
  load: loadSchema.nullable(),
  reps: repNotationSchema.nullable(),
  side: perLimbDistributionSchema.nullable(),
  tempo: tempoModifierSchema.nullable(),
  media: mediaReferenceSchema.nullable(),
  modifiers: z.array(modifierRefSchema),
  notes: notesListSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSchemaRowSchema = z.object({
  schemaId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  sets: z.number().int().positive().nullable().optional(),
  load: loadSchema.nullable().optional(),
  reps: repNotationSchema.nullable().optional(),
  side: perLimbDistributionSchema.nullable().optional(),
  tempo: tempoModifierSchema.nullable().optional(),
  media: mediaReferenceSchema.nullable().optional(),
  modifierIds: z
    .array(z.string().cuid())
    .max(SCHEMA_ROW_CONSTANTS.MAX_MODIFIERS_PER_ROW)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "modifierIds must be unique",
    })
    .optional(),
  notes: notesListSchema.nullable().optional(),
});

export const updateSchemaRowSchema = createSchemaRowSchema
  .omit({ schemaId: true, exerciseId: true })
  .partial();

export const reorderSchemaRowsSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
