import { z } from "zod";

import { intensitySchema, notesListSchema } from "../_shared";
import { compositionLabelSchema, compositionSchema } from "../composition";
import { rowGroupSchema } from "../row-group";
import { schemaRowSchema } from "../schema-row";

import { SCHEMA_CONSTANTS } from "./schema.constants";

export const schemaSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  groupId: z.string().cuid().nullable(),
  order: z.number().int().positive(),
  header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable(),
  intensity: intensitySchema.nullable(),
  composition: compositionSchema.nullable(),
  label: compositionLabelSchema.nullable(),
  notes: notesListSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const schemaWithBodySchema = z.object({
  schema: schemaSchema,
  rows: z.array(schemaRowSchema),
  rowGroups: z.array(rowGroupSchema),
});

const createSchemaBaseSchema = z.object({
  blockId: z.string().cuid(),
  groupId: z.string().cuid().nullable().optional(),
  header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
  intensity: intensitySchema.nullable().optional(),
  composition: compositionSchema.nullable().optional(),
  notes: notesListSchema.nullable().optional(),
});

export const createSchemaSchema = createSchemaBaseSchema;

export const updateSchemaSchema = createSchemaBaseSchema.partial();

export const reorderSchemasSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});

export type SchemaWithBody = z.infer<typeof schemaWithBodySchema>;
