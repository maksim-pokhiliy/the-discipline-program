import {
  type Prisma,
  type PrismaClient,
  type SchemeType,
  SchemeArchetypeKind,
} from "@prisma/client";

import { defaultSchemeParams, type SchemeParams } from "@repo/contracts/lms/_domain";

type SchemeTypeSeed = {
  name: string;
  archetypeKind: SchemeArchetypeKind;
};

const SCHEME_TYPES: readonly SchemeTypeSeed[] = [
  { name: "Sets × Reps", archetypeKind: SchemeArchetypeKind.SETS_REPS },
  { name: "AMRAP", archetypeKind: SchemeArchetypeKind.COUNT_UP },
  { name: "For Time", archetypeKind: SchemeArchetypeKind.COUNT_DOWN },
  { name: "Interval Loop", archetypeKind: SchemeArchetypeKind.INTERVAL_LOOP },
  { name: "EMOM", archetypeKind: SchemeArchetypeKind.EMOM_LOOP },
  { name: "Time-Boxed", archetypeKind: SchemeArchetypeKind.TIME_BOXED },
  { name: "Rep Ladder", archetypeKind: SchemeArchetypeKind.LADDER },
  { name: "Distance Run", archetypeKind: SchemeArchetypeKind.DISTANCE },
] as const;

const toInputJson = (params: SchemeParams): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(params)) as Prisma.InputJsonValue;

export const seedSchemeTypes = async (db: PrismaClient): Promise<Map<string, SchemeType>> => {
  const map = new Map<string, SchemeType>();

  for (const seed of SCHEME_TYPES) {
    const schemeType = await db.schemeType.create({
      data: {
        name: seed.name,
        archetypeKind: seed.archetypeKind,
        defaultParams: toInputJson(defaultSchemeParams(seed.archetypeKind)),
      },
    });

    map.set(schemeType.name, schemeType);
  }

  console.log(`  Scheme types: ${map.size}`);

  return map;
};
