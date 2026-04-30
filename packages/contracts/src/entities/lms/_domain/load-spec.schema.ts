import { z } from "zod";

export const loadSpecKindSchema = z.enum([
  "NONE",
  "SINGLE_DB",
  "DOUBLE_DB",
  "KB",
  "BARBELL",
  "RX_SCALED",
  "BANDED",
  "BODYWEIGHT_PLUS",
  "PERCENT_BENCHMARK",
]);

export const loadSpecSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("NONE") }),
  z.object({ kind: z.literal("SINGLE_DB"), kg: z.number().positive() }),
  z.object({ kind: z.literal("DOUBLE_DB"), kgEach: z.number().positive() }),
  z.object({ kind: z.literal("KB"), kg: z.number().positive() }),
  z.object({ kind: z.literal("BARBELL"), kg: z.number().positive() }),
  z.object({
    kind: z.literal("RX_SCALED"),
    rxKg: z.number().positive(),
    scaledKg: z.number().positive(),
  }),
  z.object({ kind: z.literal("BANDED"), tension: z.string() }),
  z.object({ kind: z.literal("BODYWEIGHT_PLUS"), addedKg: z.number().positive() }),
  z.object({
    kind: z.literal("PERCENT_BENCHMARK"),
    benchmarkExerciseId: z.string().cuid(),
    percent: z.number().min(1).max(120),
  }),
]);
