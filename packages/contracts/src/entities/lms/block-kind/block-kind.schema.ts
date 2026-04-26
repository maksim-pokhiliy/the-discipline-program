import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { schemeArchetypeKindSchema } from "../_domain/scheme-archetype.schema";

import { BLOCK_KIND_CONSTANTS } from "./block-kind.constants";

export const blockKindSchema = z.object({
  id: z.string().cuid(),
  scope: libraryScopeSchema,
  ownerId: z.string().cuid().nullable(),
  name: z.string().min(1).max(BLOCK_KIND_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(BLOCK_KIND_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  iconKey: z.string().max(BLOCK_KIND_CONSTANTS.MAX_ICON_KEY_LENGTH).nullable(),
  defaultWeight: z
    .number()
    .int()
    .min(BLOCK_KIND_CONSTANTS.MIN_DEFAULT_WEIGHT)
    .max(BLOCK_KIND_CONSTANTS.MAX_DEFAULT_WEIGHT),
  defaultArchetypeKind: schemeArchetypeKindSchema.nullable(),
  analyticsCategory: z.string().max(BLOCK_KIND_CONSTANTS.MAX_ANALYTICS_CATEGORY_LENGTH).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
