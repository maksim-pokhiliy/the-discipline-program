import { z } from "zod";

import { BENCHMARK_DEFINITION_CONSTANTS } from "./benchmark-definition.constants";

export const benchmarkDefinitionSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(BENCHMARK_DEFINITION_CONSTANTS.NAME_MAX_LENGTH),
  unit: z.string().min(1).max(BENCHMARK_DEFINITION_CONSTANTS.UNIT_MAX_LENGTH),
  category: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBenchmarkDefinitionSchema = z.object({
  name: z.string().min(1).max(BENCHMARK_DEFINITION_CONSTANTS.NAME_MAX_LENGTH),
  unit: z.string().min(1).max(BENCHMARK_DEFINITION_CONSTANTS.UNIT_MAX_LENGTH),
  category: z
    .string()
    .max(BENCHMARK_DEFINITION_CONSTANTS.CATEGORY_MAX_LENGTH)
    .nullable()
    .optional(),
});

export const updateBenchmarkDefinitionSchema = z.object({
  name: z.string().min(1).max(BENCHMARK_DEFINITION_CONSTANTS.NAME_MAX_LENGTH).optional(),
  unit: z.string().min(1).max(BENCHMARK_DEFINITION_CONSTANTS.UNIT_MAX_LENGTH).optional(),
  category: z
    .string()
    .max(BENCHMARK_DEFINITION_CONSTANTS.CATEGORY_MAX_LENGTH)
    .nullable()
    .optional(),
});
