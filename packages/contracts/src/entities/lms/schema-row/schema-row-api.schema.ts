import { z } from "zod";

import { idParamSchema } from "../../../common";

import {
  createSchemaRowSchema,
  reorderSchemaRowsSchema,
  schemaRowSchema,
  updateSchemaRowSchema,
} from "./schema-row.schema";

export const getSchemaRowsResponseSchema = z.array(schemaRowSchema);

export const getSchemaRowByIdParamsSchema = idParamSchema;

export const createSchemaRowRequestSchema = createSchemaRowSchema;
export const createSchemaRowResponseSchema = schemaRowSchema;

export const updateSchemaRowParamsSchema = idParamSchema;
export const updateSchemaRowRequestSchema = updateSchemaRowSchema;
export const updateSchemaRowResponseSchema = schemaRowSchema;

export const deleteSchemaRowParamsSchema = idParamSchema;

export const reorderSchemaRowsRequestSchema = reorderSchemaRowsSchema;
export const reorderSchemaRowsResponseSchema = z.object({
  schemaRows: getSchemaRowsResponseSchema,
});
