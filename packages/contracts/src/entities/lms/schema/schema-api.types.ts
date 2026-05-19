import { type z } from "zod";

import {
  type createSchemaRequestSchema,
  type createSchemaResponseSchema,
  type deleteSchemaParamsSchema,
  type getSchemaByIdParamsSchema,
  type getSchemasResponseSchema,
  type reorderSchemasRequestSchema,
  type reorderSchemasResponseSchema,
  type updateSchemaParamsSchema,
  type updateSchemaRequestSchema,
  type updateSchemaResponseSchema,
} from "./schema-api.schema";

export type GetSchemasResponse = z.infer<typeof getSchemasResponseSchema>;
export type GetSchemaByIdParams = z.infer<typeof getSchemaByIdParamsSchema>;
export type CreateSchemaRequest = z.infer<typeof createSchemaRequestSchema>;
export type CreateSchemaResponse = z.infer<typeof createSchemaResponseSchema>;
export type UpdateSchemaParams = z.infer<typeof updateSchemaParamsSchema>;
export type UpdateSchemaRequest = z.infer<typeof updateSchemaRequestSchema>;
export type UpdateSchemaResponse = z.infer<typeof updateSchemaResponseSchema>;
export type DeleteSchemaParams = z.infer<typeof deleteSchemaParamsSchema>;
export type ReorderSchemasRequest = z.infer<typeof reorderSchemasRequestSchema>;
export type ReorderSchemasResponse = z.infer<typeof reorderSchemasResponseSchema>;
