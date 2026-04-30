import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { blockTemplatePayloadSchema } from "../_domain/template-payload.schema";

import { BLOCK_TEMPLATE_CONSTANTS } from "./block-template.constants";
import { blockTemplateSchema } from "./block-template.schema";

export const createBlockTemplateInputSchema = z.object({
  scope: libraryScopeSchema.default("COACH"),
  ownerId: z.string().cuid().nullable().optional(),
  name: z.string().min(1).max(BLOCK_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(BLOCK_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  payload: blockTemplatePayloadSchema,
});

export const updateBlockTemplateInputSchema = z.object({
  name: z.string().min(1).max(BLOCK_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH).optional(),
  description: z
    .string()
    .max(BLOCK_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH)
    .nullable()
    .optional(),
  payload: blockTemplatePayloadSchema.optional(),
  scope: libraryScopeSchema.optional(),
  ownerId: z.string().cuid().nullable().optional(),
});

export const blockTemplateIdParamSchema = z.object({
  blockTemplateId: z.string().cuid(),
});

export const listBlockTemplatesQuerySchema = z.object({
  scope: libraryScopeSchema.optional(),
  ownerId: z.string().cuid().optional(),
  search: z.string().min(1).max(100).optional(),
  includeDeleted: z.boolean().optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
});

export const listBlockTemplatesResponseSchema = z.object({
  items: z.array(blockTemplateSchema),
  total: z.number().int().nonnegative(),
});

export const getBlockTemplateResponseSchema = blockTemplateSchema;
export const createBlockTemplateResponseSchema = blockTemplateSchema;
export const updateBlockTemplateResponseSchema = blockTemplateSchema;

export const promoteBlockTemplateResponseSchema = blockTemplateSchema;
export const demoteBlockTemplateInputSchema = z.object({ newOwnerId: z.string().cuid() });
export const demoteBlockTemplateResponseSchema = blockTemplateSchema;
