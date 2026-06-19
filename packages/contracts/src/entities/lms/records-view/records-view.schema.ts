import { z } from "zod";

import { resultSchema, RESULT_TYPES } from "../_shared";
import { oneRMRecordSourceSchema } from "../one-rm-record";

const isoInstant = z.string().datetime();

export const oneRMSeriesPointSchema = z.object({
  valueKg: z.number().finite().positive(),
  recordedAt: isoInstant,
});

export const oneRMRecordViewSchema = z.object({
  exerciseId: z.string().cuid(),
  exerciseName: z.string(),
  best: z.number().finite().positive(),
  bestSource: oneRMRecordSourceSchema,
  bestRecordedAt: isoInstant,
  lastRecordedAt: isoInstant,
  delta: z.number(),
  recordCount: z.number().int().nonnegative(),
  series: z.array(oneRMSeriesPointSchema),
});

export const benchmarkSeriesPointSchema = z.object({
  result: resultSchema,
  scalar: z.number(),
  recordedAt: isoInstant,
});

export const benchmarkDeltaSchema = z.object({
  value: z.number(),
  improved: z.boolean(),
});

export const benchmarkRecordViewSchema = z.object({
  plannedSchemaId: z.string().cuid(),
  title: z.string(),
  subline: z.string(),
  resultType: z.enum(RESULT_TYPES),
  best: resultSchema,
  bestRecordedAt: isoInstant,
  lastRecordedAt: isoInstant,
  delta: benchmarkDeltaSchema.nullable(),
  series: z.array(benchmarkSeriesPointSchema),
  attemptCount: z.number().int().nonnegative(),
});

export const recordsViewSchema = z.object({
  oneRM: z.array(oneRMRecordViewSchema),
  benchmarks: z.array(benchmarkRecordViewSchema),
});
