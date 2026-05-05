import { z } from "zod";

import { schemeArchetypeKindSchema, schemeParamsSchema } from "../_domain/scheme-archetype.schema";

import { SCHEME_TYPE_CONSTANTS } from "./scheme-type.constants";

export const schemeTypeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(SCHEME_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  archetypeKind: schemeArchetypeKindSchema,
  defaultParams: schemeParamsSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSchemeTypeSchema = z.object({
  name: z.string().min(1).max(SCHEME_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  archetypeKind: schemeArchetypeKindSchema,
  defaultParams: schemeParamsSchema.optional(),
});

export const updateSchemeTypeSchema = createSchemeTypeSchema.partial();
