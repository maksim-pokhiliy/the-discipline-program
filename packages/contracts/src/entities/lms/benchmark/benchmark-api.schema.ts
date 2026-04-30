import { z } from "zod";

import { benchmarkSourceSchema } from "../_domain/benchmark-source.schema";
import { prKindSchema } from "../_domain/pr-kind.schema";

import { BENCHMARK_CONSTANTS } from "./benchmark.constants";
import { benchmarkSchema } from "./benchmark.schema";

export const createBenchmarkInputSchema = z.object({
  userId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  kind: prKindSchema,
  value: z.number().positive(),
  unit: z.string().min(1).max(BENCHMARK_CONSTANTS.MAX_UNIT_LENGTH),
  source: benchmarkSourceSchema.default("MANUAL"),
  notes: z.string().max(BENCHMARK_CONSTANTS.MAX_NOTES_LENGTH).optional(),
});

export const updateBenchmarkInputSchema = z.object({
  value: z.number().positive().optional(),
  unit: z.string().min(1).max(BENCHMARK_CONSTANTS.MAX_UNIT_LENGTH).optional(),
  source: benchmarkSourceSchema.optional(),
  notes: z.string().max(BENCHMARK_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const benchmarkIdParamSchema = z.object({ benchmarkId: z.string().cuid() });

export const listBenchmarksQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  exerciseId: z.string().cuid().optional(),
  kind: prKindSchema.optional(),
});

export const listBenchmarksResponseSchema = z.object({
  items: z.array(benchmarkSchema),
  total: z.number().int().nonnegative(),
});

export const getBenchmarkResponseSchema = benchmarkSchema;
export const createBenchmarkResponseSchema = benchmarkSchema;
export const updateBenchmarkResponseSchema = benchmarkSchema;
