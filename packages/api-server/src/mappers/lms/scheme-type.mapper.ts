import { type SchemeType as PrismaSchemeType } from "@prisma/client";

import { type SchemeType } from "@repo/contracts/lms/scheme-type";

import { SCHEME_ARCHETYPE_KIND_MAP } from "./enum-maps-status";

export const mapToSchemeType = (s: PrismaSchemeType): SchemeType => ({
  id: s.id,
  name: s.name,
  archetypeKind: SCHEME_ARCHETYPE_KIND_MAP[s.archetypeKind],
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});
