import { type z } from "zod";

import {
  type createParallelSchemasRequestSchema,
  type createParallelSchemasResponseSchema,
  type createSchemaRequestSchema,
  type createSchemaResponseSchema,
  type deleteSchemaParamsSchema,
  type getSchemaByIdParamsSchema,
  type getSchemasResponseSchema,
  type reorderSchemasRequestSchema,
  type reorderSchemasResponseSchema,
  type schemaByIdParamsSchema,
  type schemaByPlanParamsSchema,
  type updateSchemaParamsSchema,
  type updateSchemaRequestSchema,
  type updateSchemaResponseSchema,
} from "./schema-api.schema";

export type GetSchemasResponse = z.infer<typeof getSchemasResponseSchema>;
export type GetSchemaByIdParams = z.infer<typeof getSchemaByIdParamsSchema>;
export type SchemaByPlanParams = z.infer<typeof schemaByPlanParamsSchema>;
export type SchemaByIdParams = z.infer<typeof schemaByIdParamsSchema>;
export type CreateSchemaRequest = z.infer<typeof createSchemaRequestSchema>;
export type CreateSchemaResponse = z.infer<typeof createSchemaResponseSchema>;
export type CreateParallelSchemasRequest = z.infer<typeof createParallelSchemasRequestSchema>;
export type CreateParallelSchemasResponse = z.infer<typeof createParallelSchemasResponseSchema>;
export type UpdateSchemaParams = z.infer<typeof updateSchemaParamsSchema>;
export type UpdateSchemaRequest = z.infer<typeof updateSchemaRequestSchema>;
export type UpdateSchemaResponse = z.infer<typeof updateSchemaResponseSchema>;
export type DeleteSchemaParams = z.infer<typeof deleteSchemaParamsSchema>;
export type ReorderSchemasRequest = z.infer<typeof reorderSchemasRequestSchema>;
export type ReorderSchemasResponse = z.infer<typeof reorderSchemasResponseSchema>;
