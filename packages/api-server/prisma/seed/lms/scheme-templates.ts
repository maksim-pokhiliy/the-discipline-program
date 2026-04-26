import { LibraryScope, type Prisma, type PrismaClient, SchemeArchetypeKind } from "@prisma/client";

import { schemeParamsSchema, type SchemeParams } from "@repo/contracts/lms/_domain";

interface SchemeTemplateSeed {
  name: string;
  description: string;
  archetypeKind: SchemeArchetypeKind;
  defaultParams: SchemeParams;
}

const emom12Simple: SchemeParams = {
  kind: "EMOM_LOOP",
  totalMinutes: 12,
  slots: [{ minutes: [0], action: { kind: "ENTRY", entryRefIndex: 0 } }],
};

const amrap15: SchemeParams = {
  kind: "COUNT_DOWN",
  durationSec: 900,
};

const fiveByThree: SchemeParams = {
  kind: "COUNT_UP",
  rounds: 5,
  progression: [
    { round: 1, reps: [3] },
    { round: 2, reps: [3] },
    { round: 3, reps: [3] },
    { round: 4, reps: [3] },
    { round: 5, reps: [3] },
  ],
};

const tabata8: SchemeParams = {
  kind: "INTERVAL_LOOP",
  sets: 8,
  slots: [
    { durationSec: 20, action: "WORK" },
    { durationSec: 10, action: "REST" },
  ],
};

const forTimeLadder: SchemeParams = {
  kind: "COUNT_UP",
  rounds: 3,
  progression: [
    { round: 1, reps: [21] },
    { round: 2, reps: [15] },
    { round: 3, reps: [9] },
  ],
};

export const SCHEME_TEMPLATE_SEEDS: readonly SchemeTemplateSeed[] = [
  {
    name: "EMOM-12 simple",
    description: "Every minute on the minute for 12 minutes — pick one entry per minute",
    archetypeKind: SchemeArchetypeKind.EMOM_LOOP,
    defaultParams: emom12Simple,
  },
  {
    name: "AMRAP-15",
    description: "As many rounds as possible in 15 minutes",
    archetypeKind: SchemeArchetypeKind.COUNT_DOWN,
    defaultParams: amrap15,
  },
  {
    name: "5x3 strength",
    description: "Five sets of three reps, increasing load",
    archetypeKind: SchemeArchetypeKind.COUNT_UP,
    defaultParams: fiveByThree,
  },
  {
    name: "Tabata-8",
    description: "Eight rounds of 20 seconds work, 10 seconds rest",
    archetypeKind: SchemeArchetypeKind.INTERVAL_LOOP,
    defaultParams: tabata8,
  },
  {
    name: "For-Time ladder 21-15-9",
    description: "Three rounds with descending rep schemes",
    archetypeKind: SchemeArchetypeKind.COUNT_UP,
    defaultParams: forTimeLadder,
  },
];

const toJsonValue = (params: SchemeParams): Prisma.InputJsonValue => {
  const validated = schemeParamsSchema.parse(params);

  return validated as Prisma.InputJsonValue;
};

export const seedSchemeTemplates = async (db: PrismaClient): Promise<number> => {
  for (const seed of SCHEME_TEMPLATE_SEEDS) {
    const defaultParams = toJsonValue(seed.defaultParams);

    const existing = await db.schemeTemplate.findFirst({
      where: { scope: LibraryScope.SYSTEM, ownerId: null, name: seed.name },
      select: { id: true },
    });

    const update: Prisma.SchemeTemplateUpdateInput = {
      description: seed.description,
      archetypeKind: seed.archetypeKind,
      defaultParams,
    };

    if (existing) {
      await db.schemeTemplate.update({ where: { id: existing.id }, data: update });
      continue;
    }

    const create: Prisma.SchemeTemplateUncheckedCreateInput = {
      scope: LibraryScope.SYSTEM,
      ownerId: null,
      name: seed.name,
      description: seed.description,
      archetypeKind: seed.archetypeKind,
      defaultParams,
    };

    await db.schemeTemplate.create({ data: create });
  }

  return SCHEME_TEMPLATE_SEEDS.length;
};
