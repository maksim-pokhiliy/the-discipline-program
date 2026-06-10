import { z } from "zod";

import { idParamSchema } from "../../../common";

import { SCHEMA_CONSTANTS } from "./schema.constants";
import {
  createSchemaSchema,
  reorderSchemasSchema,
  schemaSchema,
  schemaWithBodySchema,
  updateSchemaSchema,
} from "./schema.schema";

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

export const createParallelSchemasRequestSchema = z
  .object({
    blockId: z.string().cuid(),
    parentSchemaId: z.string().cuid().nullable().optional(),
    header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
    tracks: z
      .array(
        z
          .object({
            header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
            steps: z.array(z.number().int().positive()).min(1),
          })
          .strict(),
      )
      .min(2),
  })
  .strict();
export const createParallelSchemasResponseSchema = schemaWithBodySchema;

export const updateSchemaParamsSchema = idParamSchema;
export const updateSchemaRequestSchema = updateSchemaSchema;
export const updateSchemaResponseSchema = schemaSchema;

export const deleteSchemaParamsSchema = idParamSchema;

export const reorderSchemasRequestSchema = z.union([
  reorderSchemasSchema.extend({
    blockId: z.string().cuid(),
    parentSchemaId: z.undefined().optional(),
  }),
  reorderSchemasSchema.extend({
    blockId: z.undefined().optional(),
    parentSchemaId: z.string().cuid(),
  }),
]);
export const reorderSchemasResponseSchema = z.object({
  schemas: getSchemasResponseSchema,
});
