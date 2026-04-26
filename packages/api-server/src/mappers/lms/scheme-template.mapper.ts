import { type SchemeTemplate as PrismaSchemeTemplate } from "@prisma/client";

import { schemeParamsSchema } from "@repo/contracts/lms/_domain";
import { type SchemeTemplate } from "@repo/contracts/lms/scheme-template";

import { LIBRARY_SCOPE_MAP, SCHEME_ARCHETYPE_KIND_MAP } from "./enum-maps";

export const mapToSchemeTemplate = (s: PrismaSchemeTemplate): SchemeTemplate => ({
  id: s.id,
  scope: LIBRARY_SCOPE_MAP[s.scope],
  ownerId: s.ownerId,
  name: s.name,
  description: s.description,
  archetypeKind: SCHEME_ARCHETYPE_KIND_MAP[s.archetypeKind],
  defaultParams: schemeParamsSchema.parse(s.defaultParams),
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
  deletedAt: s.deletedAt,
});
