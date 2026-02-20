import { type z } from "zod";

import {
  type createBenchmarkDefinitionRequestSchema,
  type createBenchmarkDefinitionResponseSchema,
  type deleteBenchmarkDefinitionParamsSchema,
  type getBenchmarkDefinitionByIdParamsSchema,
  type getBenchmarkDefinitionResponseSchema,
  type getBenchmarkDefinitionsResponseSchema,
  type updateBenchmarkDefinitionParamsSchema,
  type updateBenchmarkDefinitionRequestSchema,
  type updateBenchmarkDefinitionResponseSchema,
} from "./benchmark-definition-api.schema";

export type GetBenchmarkDefinitionsResponse = z.infer<typeof getBenchmarkDefinitionsResponseSchema>;
export type GetBenchmarkDefinitionByIdParams = z.infer<
  typeof getBenchmarkDefinitionByIdParamsSchema
>;
export type GetBenchmarkDefinitionResponse = z.infer<typeof getBenchmarkDefinitionResponseSchema>;
export type CreateBenchmarkDefinitionRequest = z.infer<
  typeof createBenchmarkDefinitionRequestSchema
>;
export type CreateBenchmarkDefinitionResponse = z.infer<
  typeof createBenchmarkDefinitionResponseSchema
>;
export type UpdateBenchmarkDefinitionParams = z.infer<typeof updateBenchmarkDefinitionParamsSchema>;
export type UpdateBenchmarkDefinitionRequest = z.infer<
  typeof updateBenchmarkDefinitionRequestSchema
>;
export type UpdateBenchmarkDefinitionResponse = z.infer<
  typeof updateBenchmarkDefinitionResponseSchema
>;
export type DeleteBenchmarkDefinitionParams = z.infer<typeof deleteBenchmarkDefinitionParamsSchema>;
