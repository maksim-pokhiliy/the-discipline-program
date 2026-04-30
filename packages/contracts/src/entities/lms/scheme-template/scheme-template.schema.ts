import { z } from "zod";

import { libraryScopeSchema } from "../_domain/library-scope.schema";
import { schemeArchetypeKindSchema, schemeParamsSchema } from "../_domain/scheme-archetype.schema";

import { SCHEME_TEMPLATE_CONSTANTS } from "./scheme-template.constants";

export const schemeTemplateSchema = z.object({
  id: z.string().cuid(),
  scope: libraryScopeSchema,
  ownerId: z.string().cuid().nullable(),
  name: z.string().min(1).max(SCHEME_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH),
  description: z.string().max(SCHEME_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullable(),
  archetypeKind: schemeArchetypeKindSchema,
  defaultParams: schemeParamsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
