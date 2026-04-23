import { z } from "zod";

import { blockTypeIdParamSchema } from "../../../common";

import { blockTypeSchema, createBlockTypeSchema, updateBlockTypeSchema } from "./block-type.schema";

export const getBlockTypesQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional(),
});

export const getBlockTypesResponseSchema = z.array(blockTypeSchema);

export const getBlockTypeByIdParamsSchema = blockTypeIdParamSchema;

export const getBlockTypeResponseSchema = blockTypeSchema;

export const createBlockTypeRequestSchema = createBlockTypeSchema;

export const createBlockTypeResponseSchema = blockTypeSchema;

export const updateBlockTypeParamsSchema = blockTypeIdParamSchema;

export const updateBlockTypeRequestSchema = updateBlockTypeSchema;

export const updateBlockTypeResponseSchema = blockTypeSchema;

export const deleteBlockTypeParamsSchema = blockTypeIdParamSchema;
