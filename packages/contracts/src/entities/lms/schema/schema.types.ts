import { type z } from "zod";

import {
  type createSchemaSchema,
  type reorderSchemasSchema,
  type schemaSchema,
  type updateSchemaSchema,
} from "./schema.schema";

export { type SchemaWithBody } from "./schema.schema";

export type Schema = z.infer<typeof schemaSchema>;
export type CreateSchemaData = z.infer<typeof createSchemaSchema>;
export type UpdateSchemaData = z.infer<typeof updateSchemaSchema>;
export type ReorderSchemasData = z.infer<typeof reorderSchemasSchema>;
