import { z } from "zod";

import {
  exactOrRangeSchema,
  loadSchema,
  mediaReferenceSchema,
  notesListSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  restSpecSchema,
  RESULT_TYPES,
  tempoModifierSchema,
  timeCapSchema,
} from "../_shared";

export const INTERVAL_DURATION_UNITS = ["sec", "min"] as const;

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
      work: z.object({ value: z.number().positive(), unit: z.enum(INTERVAL_DURATION_UNITS) }),
      off: z.object({ value: z.number().nonnegative(), unit: z.enum(INTERVAL_DURATION_UNITS) }),
      count: z.number().int().positive(),
    })
    .strict(),
]);

export const restAxisSchema = restSpecSchema;

export const benchmarkSchema = z.object({ resultType: z.enum(RESULT_TYPES) });

export const compositionSchema = z
  .object({
    repetition: repetitionAxisSchema.optional(),
    rest: restAxisSchema.optional(),
    cap: timeCapSchema.optional(),
    benchmark: benchmarkSchema.nullable().optional(),
  })
  .strict();

export const composeRowSchema = z
  .object({
    nodeType: z.literal("row"),
    id: z.string().cuid(),
    exerciseId: z.string().cuid(),
    reps: repNotationSchema.nullable(),
    load: loadSchema.nullable(),
    side: perLimbDistributionSchema.nullable(),
    tempo: tempoModifierSchema.nullable(),
    media: mediaReferenceSchema.nullable(),
    notes: notesListSchema.nullable(),
  })
  .strict();

export const composeContainerSchema = z
  .object({
    nodeType: z.literal("container"),
    id: z.string().cuid(),
    header: z.string().nullable(),
    notes: notesListSchema.nullable(),
    composition: compositionSchema,
    children: z.array(composeRowSchema),
  })
  .strict();
