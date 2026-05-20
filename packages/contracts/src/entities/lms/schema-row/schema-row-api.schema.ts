import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createSchemaRowSchema, schemaRowSchema, updateSchemaRowSchema } from "./schema-row.schema";

export const getSchemaRowsResponseSchema = z.array(schemaRowSchema);

export const getSchemaRowByIdParamsSchema = idParamSchema;

export const schemaRowByPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const schemaRowByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  schemaRowId: z.string().cuid(),
});

export const createSchemaRowRequestSchema = createSchemaRowSchema;
export const createSchemaRowResponseSchema = schemaRowSchema;

export const updateSchemaRowParamsSchema = idParamSchema;
export const updateSchemaRowRequestSchema = updateSchemaRowSchema;
export const updateSchemaRowResponseSchema = schemaRowSchema;

export const deleteSchemaRowParamsSchema = idParamSchema;

export const reorderSchemaRowsRequestSchema = z.object({
  schemaId: z.string().cuid(),
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
export const reorderSchemaRowsResponseSchema = z.object({
  schemaRows: getSchemaRowsResponseSchema,
});
