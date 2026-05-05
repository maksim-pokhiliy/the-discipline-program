import { z } from "zod";

import { idParamSchema } from "../../../common";

import { blockTypeSchema, createBlockTypeSchema, updateBlockTypeSchema } from "./block-type.schema";

export const getBlockTypesResponseSchema = z.array(blockTypeSchema);

export const getBlockTypeByIdParamsSchema = idParamSchema;

export const getBlockTypeResponseSchema = blockTypeSchema;

export const createBlockTypeRequestSchema = createBlockTypeSchema;

export const createBlockTypeResponseSchema = blockTypeSchema;

export const updateBlockTypeParamsSchema = idParamSchema;

export const updateBlockTypeRequestSchema = updateBlockTypeSchema;

export const updateBlockTypeResponseSchema = blockTypeSchema;

export const deleteBlockTypeParamsSchema = idParamSchema;

export const getBlockTypesPageDataResponseSchema = z.object({
  blockTypes: getBlockTypesResponseSchema,
});
