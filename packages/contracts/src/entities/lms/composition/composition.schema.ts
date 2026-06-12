import { z } from "zod";

import {
  exactOrRangeSchema,
  intensitySchema,
  loadSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  restSpecSchema,
  tempoModifierSchema,
  timeCapSchema,
} from "../_shared";
import { positionSchema, rowKindSchema, schemaRowPayloadSchema } from "../schema-row";

export const repetitionAxisSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("once") }).strict(),
  z.object({ kind: z.literal("count"), count: exactOrRangeSchema }).strict(),
  z
    .object({
      kind: z.literal("ladder"),
      steps: z.array(z.number().int().positive()).min(1),
    })
    .strict(),
  z.object({ kind: z.literal("timeCap"), cap: timeCapSchema }).strict(),
  z
    .object({
      kind: z.literal("cadence"),
      everyMin: z.number().int().positive(),
      rounds: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("interval"),
      workMin: z.number().int().positive(),
      offMin: z.number().int().nonnegative(),
      count: z.number().int().positive(),
    })
    .strict(),
]);

export const restAxisSchema = restSpecSchema;

export const compositionSchema = z
  .object({
    repetition: repetitionAxisSchema.optional(),
    rest: restAxisSchema.optional(),
  })
  .strict();

export const composeRowSchema = z
  .object({
    nodeType: z.literal("row"),
    id: z.string().cuid(),
    rowKind: rowKindSchema,
    rowPayload: schemaRowPayloadSchema,
    reps: repNotationSchema.nullable(),
    load: loadSchema.nullable(),
    side: perLimbDistributionSchema.nullable(),
    tempo: tempoModifierSchema.nullable(),
    position: positionSchema.nullable(),
    intensity: intensitySchema.nullable(),
    notes: z.string().nullable(),
  })
  .strict();

export const composeContainerSchema = z
  .object({
    nodeType: z.literal("container"),
    id: z.string().cuid(),
    header: z.string().nullable(),
    notes: z.string().nullable(),
    composition: compositionSchema,
    children: z.array(composeRowSchema),
  })
  .strict();
