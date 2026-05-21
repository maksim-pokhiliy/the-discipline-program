import { type Archetype as PrismaArchetype } from "@prisma/client";

import { type Archetype } from "@repo/contracts/lms/archetype";
import { archetypeNameSchema } from "@repo/contracts/lms/schema";

export const mapToArchetype = (row: PrismaArchetype): Archetype => ({
  id: row.id,
  name: archetypeNameSchema.parse(row.name),
  kind: row.kind,
  family: row.family,
  headerPatternDescription: row.headerPatternDescription,
  bodyLayoutDescription: row.bodyLayoutDescription,
  archetypeParamsSchema: row.archetypeParamsSchema,
  relatedArchetypes: row.relatedArchetypes,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
