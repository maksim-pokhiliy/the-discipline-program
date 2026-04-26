import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { schemeArchetypeKindSchema, schemeParamsSchema } from "../_domain/scheme-archetype.schema";

import { SCHEME_TEMPLATE_CONSTANTS } from "./scheme-template.constants";
import { schemeTemplateSchema } from "./scheme-template.schema";

export const createSchemeTemplateInputSchema = z.object({
  scope: libraryScopeSchema.default("COACH"),
  name: z.string().min(1).max(SCHEME_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(SCHEME_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  archetypeKind: schemeArchetypeKindSchema,
  defaultParams: schemeParamsSchema,
});

export const updateSchemeTemplateInputSchema = z.object({
  name: z.string().min(1).max(SCHEME_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH).optional(),
  description: z
    .string()
    .max(SCHEME_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH)
    .nullable()
    .optional(),
  archetypeKind: schemeArchetypeKindSchema.optional(),
  defaultParams: schemeParamsSchema.optional(),
});

export const schemeTemplateIdParamSchema = z.object({
  schemeTemplateId: z.string().cuid(),
});

export const listSchemeTemplatesQuerySchema = z.object({
  scope: libraryScopeSchema.optional(),
  ownerId: z.string().cuid().optional(),
  archetypeKind: schemeArchetypeKindSchema.optional(),
  includeDeleted: z.boolean().optional(),
});

export const listSchemeTemplatesResponseSchema = z.object({
  items: z.array(schemeTemplateSchema),
  total: z.number().int().nonnegative(),
});

export const getSchemeTemplateResponseSchema = schemeTemplateSchema;
export const createSchemeTemplateResponseSchema = schemeTemplateSchema;
export const updateSchemeTemplateResponseSchema = schemeTemplateSchema;

export const promoteSchemeTemplateResponseSchema = schemeTemplateSchema;
export const demoteSchemeTemplateInputSchema = z.object({ newOwnerId: z.string().cuid() });
export const demoteSchemeTemplateResponseSchema = schemeTemplateSchema;
