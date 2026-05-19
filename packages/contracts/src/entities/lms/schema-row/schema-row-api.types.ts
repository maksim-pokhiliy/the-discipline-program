import { type z } from "zod";

import {
  type createSchemaRowRequestSchema,
  type createSchemaRowResponseSchema,
  type deleteSchemaRowParamsSchema,
  type getSchemaRowByIdParamsSchema,
  type getSchemaRowsResponseSchema,
  type reorderSchemaRowsRequestSchema,
  type reorderSchemaRowsResponseSchema,
  type updateSchemaRowParamsSchema,
  type updateSchemaRowRequestSchema,
  type updateSchemaRowResponseSchema,
} from "./schema-row-api.schema";

export type GetSchemaRowsResponse = z.infer<typeof getSchemaRowsResponseSchema>;
export type GetSchemaRowByIdParams = z.infer<typeof getSchemaRowByIdParamsSchema>;
export type CreateSchemaRowRequest = z.infer<typeof createSchemaRowRequestSchema>;
export type CreateSchemaRowResponse = z.infer<typeof createSchemaRowResponseSchema>;
export type UpdateSchemaRowParams = z.infer<typeof updateSchemaRowParamsSchema>;
export type UpdateSchemaRowRequest = z.infer<typeof updateSchemaRowRequestSchema>;
export type UpdateSchemaRowResponse = z.infer<typeof updateSchemaRowResponseSchema>;
export type DeleteSchemaRowParams = z.infer<typeof deleteSchemaRowParamsSchema>;
export type ReorderSchemaRowsRequest = z.infer<typeof reorderSchemaRowsRequestSchema>;
export type ReorderSchemaRowsResponse = z.infer<typeof reorderSchemaRowsResponseSchema>;
