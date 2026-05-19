import { type z } from "zod";

import {
  type createSchemaRowSchema,
  type reorderSchemaRowsSchema,
  type schemaRowPayloadSchema,
  type schemaRowSchema,
  type updateSchemaRowSchema,
} from "./schema-row.schema";

export type SchemaRow = z.infer<typeof schemaRowSchema>;
export type SchemaRowPayload = z.infer<typeof schemaRowPayloadSchema>;
export type CreateSchemaRowData = z.infer<typeof createSchemaRowSchema>;
export type UpdateSchemaRowData = z.infer<typeof updateSchemaRowSchema>;
export type ReorderSchemaRowsData = z.infer<typeof reorderSchemaRowsSchema>;
