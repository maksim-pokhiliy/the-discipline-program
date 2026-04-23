import { z } from "zod";

import { SCHEME_CONSTANTS, SCHEME_PARAM_KEYS, SchemeKind } from "./scheme.constants";

export const schemeKindSchema = z.nativeEnum(SchemeKind);

export const schemeParamKeySchema = z.enum(SCHEME_PARAM_KEYS);

export const schemeSchema = z.object({
  id: z.string().cuid(),
  slug: z.string().min(1).max(SCHEME_CONSTANTS.MAX_SLUG_LENGTH),
  name: z.string().min(1).max(SCHEME_CONSTANTS.MAX_NAME_LENGTH),
  kind: schemeKindSchema,
  description: z.string().max(SCHEME_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  requiredParams: z.array(schemeParamKeySchema),
  paramDefaults: z.record(schemeParamKeySchema, z.number().nonnegative()),
  active: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSchemeSchema = z.object({
  slug: z.string().min(1).max(SCHEME_CONSTANTS.MAX_SLUG_LENGTH),
  name: z.string().min(1).max(SCHEME_CONSTANTS.MAX_NAME_LENGTH),
  kind: schemeKindSchema,
  description: z.string().max(SCHEME_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  requiredParams: z.array(schemeParamKeySchema).default([]),
  paramDefaults: z.record(schemeParamKeySchema, z.number().nonnegative()).default({}),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateSchemeSchema = createSchemeSchema.partial();
