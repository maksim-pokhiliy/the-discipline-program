import { z } from "zod";

import {
  benchmarkDefinitionSchema,
  createBenchmarkDefinitionSchema,
  updateBenchmarkDefinitionSchema,
} from "./benchmark-definition.schema";

export const getBenchmarkDefinitionsResponseSchema = z.array(benchmarkDefinitionSchema);

export const getBenchmarkDefinitionByIdParamsSchema = z.object({
  definitionId: z.string().cuid(),
});

export const getBenchmarkDefinitionResponseSchema = benchmarkDefinitionSchema;

export const createBenchmarkDefinitionRequestSchema = createBenchmarkDefinitionSchema;

export const createBenchmarkDefinitionResponseSchema = benchmarkDefinitionSchema;

export const updateBenchmarkDefinitionParamsSchema = z.object({
  definitionId: z.string().cuid(),
});

export const updateBenchmarkDefinitionRequestSchema = updateBenchmarkDefinitionSchema;

export const updateBenchmarkDefinitionResponseSchema = benchmarkDefinitionSchema;

export const deleteBenchmarkDefinitionParamsSchema = z.object({
  definitionId: z.string().cuid(),
});
