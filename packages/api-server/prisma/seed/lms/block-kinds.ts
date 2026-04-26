import { LibraryScope, type Prisma, type PrismaClient, SchemeArchetypeKind } from "@prisma/client";

interface BlockKindSeed {
  name: string;
  description: string;
  iconKey: string;
  defaultWeight: number;
  defaultArchetypeKind: SchemeArchetypeKind;
  analyticsCategory: string;
}

export const BLOCK_KIND_SEEDS: readonly BlockKindSeed[] = [
  {
    name: "Warm-up",
    description: "Activation, mobility, primer work",
    iconKey: "flame",
    defaultWeight: 1,
    defaultArchetypeKind: SchemeArchetypeKind.NONE,
    analyticsCategory: "warmup",
  },
  {
    name: "Cool-down",
    description: "Recovery, stretching, parasympathetic shift",
    iconKey: "wind",
    defaultWeight: 1,
    defaultArchetypeKind: SchemeArchetypeKind.NONE,
    analyticsCategory: "cooldown",
  },
  {
    name: "MetCon",
    description: "Metabolic conditioning workouts",
    iconKey: "timer",
    defaultWeight: 3,
    defaultArchetypeKind: SchemeArchetypeKind.COUNT_DOWN,
    analyticsCategory: "metcon",
  },
  {
    name: "Strength",
    description: "Heavy strength sets, low rep",
    iconKey: "dumbbell",
    defaultWeight: 2,
    defaultArchetypeKind: SchemeArchetypeKind.COUNT_UP,
    analyticsCategory: "strength",
  },
  {
    name: "Gymnastics",
    description: "Bodyweight skill and strength",
    iconKey: "shield",
    defaultWeight: 2,
    defaultArchetypeKind: SchemeArchetypeKind.COUNT_UP,
    analyticsCategory: "gymnastics",
  },
  {
    name: "Accessory",
    description: "Supplementary muscle work",
    iconKey: "layers",
    defaultWeight: 1,
    defaultArchetypeKind: SchemeArchetypeKind.COUNT_UP,
    analyticsCategory: "accessory",
  },
  {
    name: "Core",
    description: "Trunk and stability work",
    iconKey: "target",
    defaultWeight: 1,
    defaultArchetypeKind: SchemeArchetypeKind.COUNT_UP,
    analyticsCategory: "core",
  },
  {
    name: "Run",
    description: "Running intervals or steady-state",
    iconKey: "footprints",
    defaultWeight: 2,
    defaultArchetypeKind: SchemeArchetypeKind.COUNT_UP,
    analyticsCategory: "cardio",
  },
  {
    name: "Skill",
    description: "Technical practice, drills",
    iconKey: "brain",
    defaultWeight: 1,
    defaultArchetypeKind: SchemeArchetypeKind.NONE,
    analyticsCategory: "skill",
  },
  {
    name: "Cardio",
    description: "Non-running cardio (row, bike, ski)",
    iconKey: "heart-pulse",
    defaultWeight: 2,
    defaultArchetypeKind: SchemeArchetypeKind.COUNT_UP,
    analyticsCategory: "cardio",
  },
];

export const seedBlockKinds = async (db: PrismaClient): Promise<number> => {
  for (const seed of BLOCK_KIND_SEEDS) {
    const existing = await db.blockKind.findFirst({
      where: { scope: LibraryScope.SYSTEM, ownerId: null, name: seed.name },
      select: { id: true },
    });

    const update: Prisma.BlockKindUpdateInput = {
      description: seed.description,
      iconKey: seed.iconKey,
      defaultWeight: seed.defaultWeight,
      defaultArchetypeKind: seed.defaultArchetypeKind,
      analyticsCategory: seed.analyticsCategory,
    };

    if (existing) {
      await db.blockKind.update({ where: { id: existing.id }, data: update });
      continue;
    }

    const create: Prisma.BlockKindUncheckedCreateInput = {
      scope: LibraryScope.SYSTEM,
      ownerId: null,
      name: seed.name,
      description: seed.description,
      iconKey: seed.iconKey,
      defaultWeight: seed.defaultWeight,
      defaultArchetypeKind: seed.defaultArchetypeKind,
      analyticsCategory: seed.analyticsCategory,
    };

    await db.blockKind.create({ data: create });
  }

  return BLOCK_KIND_SEEDS.length;
};
