import { z } from "zod";

import { idParamSchema } from "../../../common";

import {
  createSchemaSchema,
  reorderSchemasSchema,
  schemaSchema,
  updateSchemaSchema,
} from "./schema.schema";

export const getSchemasResponseSchema = z.array(schemaSchema);

export const getSchemaByIdParamsSchema = idParamSchema;

export const createSchemaRequestSchema = createSchemaSchema;
export const createSchemaResponseSchema = schemaSchema;

export const updateSchemaParamsSchema = idParamSchema;
export const updateSchemaRequestSchema = updateSchemaSchema;
export const updateSchemaResponseSchema = schemaSchema;

export const deleteSchemaParamsSchema = idParamSchema;

export const reorderSchemasRequestSchema = reorderSchemasSchema;
export const reorderSchemasResponseSchema = z.object({
  schemas: getSchemasResponseSchema,
});
