import { type BlockKind as PrismaBlockKind } from "@prisma/client";

import { type BlockKind } from "@repo/contracts/lms/block-kind";

import { LIBRARY_SCOPE_MAP, SCHEME_ARCHETYPE_KIND_MAP } from "./enum-maps";

export const mapToBlockKind = (b: PrismaBlockKind): BlockKind => ({
  id: b.id,
  scope: LIBRARY_SCOPE_MAP[b.scope],
  ownerId: b.ownerId,
  name: b.name,
  description: b.description,
  iconKey: b.iconKey,
  defaultWeight: b.defaultWeight,
  defaultArchetypeKind:
    b.defaultArchetypeKind === null ? null : SCHEME_ARCHETYPE_KIND_MAP[b.defaultArchetypeKind],
  analyticsCategory: b.analyticsCategory,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
  deletedAt: b.deletedAt,
});
