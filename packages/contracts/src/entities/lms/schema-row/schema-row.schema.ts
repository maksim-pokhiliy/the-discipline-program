import { z } from "zod";

import {
  exerciseFormSchema,
  intensitySchema,
  loadSchema,
  mediaReferenceSchema,
  perLimbDistributionSchema,
  placeholderPayloadSchema,
  repNotationSchema,
  restSpecSchema,
  sequenceIndicatorSchema,
  tempoModifierSchema,
} from "../_shared";

import { POSITIONS, ROW_KINDS, SCHEMA_ROW_CONSTANTS } from "./schema-row.constants";

export const rowKindSchema = z.enum(ROW_KINDS);
export const positionSchema = z.enum(POSITIONS);

export const schemaRowPayloadSchema = z.discriminatedUnion("rowKind", [
  z.object({
    rowKind: z.literal("EXERCISE"),
    exercise: exerciseFormSchema,
  }),
  z.object({
    rowKind: z.literal("REST"),
    raw: z.string().min(1),
    parsed: restSpecSchema,
  }),
  z.object({
    rowKind: z.literal("PLACEHOLDER"),
    placeholder: placeholderPayloadSchema,
  }),
  z.object({ rowKind: z.literal("REST_SLOT") }),
]);

export const schemaRowSchema = z.object({
  id: z.string().cuid(),
  schemaId: z.string().cuid(),
  order: z.number().int().positive(),
  rowKind: rowKindSchema,
  rowPayload: schemaRowPayloadSchema,
  load: loadSchema.nullable(),
  reps: repNotationSchema.nullable(),
  side: perLimbDistributionSchema.nullable(),
  tempo: tempoModifierSchema.nullable(),
  position: positionSchema.nullable(),
  sequence: sequenceIndicatorSchema.nullable(),
  intensity: intensitySchema.nullable(),
  media: mediaReferenceSchema.nullable(),
  notes: z.string().max(SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSchemaRowSchema = z.object({
  schemaId: z.string().cuid(),
  rowKind: rowKindSchema,
  rowPayload: schemaRowPayloadSchema,
  load: loadSchema.nullable().optional(),
  reps: repNotationSchema.nullable().optional(),
  side: perLimbDistributionSchema.nullable().optional(),
  tempo: tempoModifierSchema.nullable().optional(),
  position: positionSchema.nullable().optional(),
  sequence: sequenceIndicatorSchema.nullable().optional(),
  intensity: intensitySchema.nullable().optional(),
  media: mediaReferenceSchema.nullable().optional(),
  notes: z.string().max(SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const updateSchemaRowSchema = createSchemaRowSchema.partial();

export const reorderSchemaRowsSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
