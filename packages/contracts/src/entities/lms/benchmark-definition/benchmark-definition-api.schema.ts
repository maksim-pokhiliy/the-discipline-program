import { z } from "zod";

import {
  benchmarkDefinitionSchema,
  createBenchmarkDefinitionSchema,
  updateBenchmarkDefinitionSchema,
} from "./benchmark-definition.schema";

const definitionIdParamSchema = z.object({ definitionId: z.string().cuid() });

export const getBenchmarkDefinitionsResponseSchema = z.array(benchmarkDefinitionSchema);

export const getBenchmarkDefinitionByIdParamsSchema = definitionIdParamSchema;

export const getBenchmarkDefinitionResponseSchema = benchmarkDefinitionSchema;

export const createBenchmarkDefinitionRequestSchema = createBenchmarkDefinitionSchema;

export const createBenchmarkDefinitionResponseSchema = benchmarkDefinitionSchema;

export const updateBenchmarkDefinitionParamsSchema = definitionIdParamSchema;

export const updateBenchmarkDefinitionRequestSchema = updateBenchmarkDefinitionSchema;

export const updateBenchmarkDefinitionResponseSchema = benchmarkDefinitionSchema;

export const deleteBenchmarkDefinitionParamsSchema = definitionIdParamSchema;
