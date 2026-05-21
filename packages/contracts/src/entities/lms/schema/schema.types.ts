import { type z } from "zod";

import { type archetypeParamsSchema } from "./archetype-params.schema";
import {
  type createSchemaSchema,
  type reorderSchemasSchema,
  type schemaSchema,
  type trailingConnectorSchema,
  type updateSchemaSchema,
} from "./schema.schema";

export { type SchemaWithBody } from "./schema.schema";

export type Schema = z.infer<typeof schemaSchema>;
export type CreateSchemaData = z.infer<typeof createSchemaSchema>;
export type UpdateSchemaData = z.infer<typeof updateSchemaSchema>;
export type ReorderSchemasData = z.infer<typeof reorderSchemasSchema>;
export type ArchetypeParams = z.infer<typeof archetypeParamsSchema>;
export type TrailingConnector = z.infer<typeof trailingConnectorSchema>;
