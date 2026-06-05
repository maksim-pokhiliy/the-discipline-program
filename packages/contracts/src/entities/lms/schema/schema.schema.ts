import { z } from "zod";

import { intensitySchema } from "../_shared";
import { compositionLabelSchema, compositionSchema } from "../composition";
import { type SchemaRow, schemaRowSchema } from "../schema-row";

import { SCHEMA_CONSTANTS } from "./schema.constants";

type SchemaShape = {
  id: string;
  blockId: string;
  parentSchemaId: string | null;
  order: number;
  header: string | null;
  intensity: z.infer<typeof intensitySchema> | null;
  composition: z.infer<typeof compositionSchema> | null;
  label: z.infer<typeof compositionLabelSchema> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const schemaSchema: z.ZodType<SchemaShape> = z.lazy(() =>
  z.object({
    id: z.string().cuid(),
    blockId: z.string().cuid(),
    parentSchemaId: z.string().cuid().nullable(),
    order: z.number().int().positive(),
    header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable(),
    intensity: intensitySchema.nullable(),
    composition: compositionSchema.nullable(),
    label: compositionLabelSchema.nullable(),
    notes: z.string().max(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export type SchemaWithBody = {
  schema: z.infer<typeof schemaSchema>;
  rows: SchemaRow[];
  subSchemas: SchemaWithBody[];
};

export const schemaWithBodySchema: z.ZodType<SchemaWithBody> = z.lazy(() =>
  z.object({
    schema: schemaSchema,
    rows: z.array(schemaRowSchema),
    subSchemas: z.array(schemaWithBodySchema),
  }),
);

const createSchemaBaseSchema = z.object({
  blockId: z.string().cuid(),
  parentSchemaId: z.string().cuid().nullable().optional(),
  header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
  intensity: intensitySchema.nullable().optional(),
  composition: compositionSchema.nullable().optional(),
  notes: z.string().max(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
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
