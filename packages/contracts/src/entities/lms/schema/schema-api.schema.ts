import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createSchemaSchema, schemaSchema, updateSchemaSchema } from "./schema.schema";

export const getSchemasResponseSchema = z.array(schemaSchema);

export const getSchemaByIdParamsSchema = idParamSchema;

export const schemaByPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const schemaByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  schemaId: z.string().cuid(),
});

export const createSchemaRequestSchema = createSchemaSchema;
export const createSchemaResponseSchema = schemaSchema;

export const updateSchemaParamsSchema = idParamSchema;
export const updateSchemaRequestSchema = updateSchemaSchema;
export const updateSchemaResponseSchema = schemaSchema;

export const deleteSchemaParamsSchema = idParamSchema;

export const reorderSchemasRequestSchema = z
  .object({
    blockId: z.string().cuid().optional(),
    parentSchemaId: z.string().cuid().optional(),
    orderedIds: z
      .array(z.string().cuid())
      .min(1)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "orderedIds must be unique",
      }),
  })
  .superRefine((value, ctx) => {
    const scopeKeyCount =
      Number(value.blockId !== undefined) + Number(value.parentSchemaId !== undefined);

    if (scopeKeyCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blockId"],
        message: "exactly one of blockId or parentSchemaId must be provided",
      });
    }
  });
export const reorderSchemasResponseSchema = z.object({
  schemas: getSchemasResponseSchema,
});
