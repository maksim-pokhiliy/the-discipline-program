import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { schemeArchetypeKindSchema } from "../_domain/scheme-archetype.schema";

import { BLOCK_KIND_CONSTANTS } from "./block-kind.constants";
import { blockKindSchema } from "./block-kind.schema";

export const createBlockKindInputSchema = z.object({
  scope: libraryScopeSchema.default("COACH"),
  name: z.string().min(1).max(BLOCK_KIND_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(BLOCK_KIND_CONSTANTS.MAX_DESCRIPTION_LENGTH).optional(),
  iconKey: z.string().max(BLOCK_KIND_CONSTANTS.MAX_ICON_KEY_LENGTH).optional(),
  defaultWeight: z
    .number()
    .int()
    .min(BLOCK_KIND_CONSTANTS.MIN_DEFAULT_WEIGHT)
    .max(BLOCK_KIND_CONSTANTS.MAX_DEFAULT_WEIGHT)
    .default(1),
  defaultArchetypeKind: schemeArchetypeKindSchema.optional(),
  analyticsCategory: z.string().max(BLOCK_KIND_CONSTANTS.MAX_ANALYTICS_CATEGORY_LENGTH).optional(),
});

export const updateBlockKindInputSchema = createBlockKindInputSchema.partial();

export const blockKindIdParamSchema = z.object({ blockKindId: z.string().cuid() });

export const listBlockKindsQuerySchema = z.object({
  scope: libraryScopeSchema.optional(),
  ownerId: z.string().cuid().optional(),
  includeDeleted: z.boolean().optional(),
});

export const listBlockKindsResponseSchema = z.object({
  items: z.array(blockKindSchema),
  total: z.number().int().nonnegative(),
});

export const getBlockKindResponseSchema = blockKindSchema;
export const createBlockKindResponseSchema = blockKindSchema;
export const updateBlockKindResponseSchema = blockKindSchema;
