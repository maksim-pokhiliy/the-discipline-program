import { type Prisma, type PrismaClient } from "@prisma/client";

import { HEADERLESS_MODALITY_ARCHETYPES } from "./headerless-modality";
import { NESTED_NAMED_ARCHETYPES } from "./nested-named";
import { ROUNDS_LADDER_ARCHETYPES } from "./rounds-ladder";
import { TIME_COMPOSITE_ARCHETYPES } from "./time-composite";

const ALL_ARCHETYPES: Prisma.ArchetypeCreateManyInput[] = [
  ...ROUNDS_LADDER_ARCHETYPES,
  ...TIME_COMPOSITE_ARCHETYPES,
  ...NESTED_NAMED_ARCHETYPES,
  ...HEADERLESS_MODALITY_ARCHETYPES,
];

export const seedArchetypes = async (db: PrismaClient): Promise<void> => {
  await db.archetype.createMany({ data: ALL_ARCHETYPES });
  console.log(`  Archetypes: ${ALL_ARCHETYPES.length}`);
};
