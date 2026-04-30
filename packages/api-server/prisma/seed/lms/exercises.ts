import { LibraryScope, type Prisma, type PrismaClient } from "@prisma/client";

import { CARDIO_MISC_SEEDS } from "./exercises/cardio-misc";
import { CORE_GYMNASTIC_SEEDS } from "./exercises/core-gymnastic";
import { type ExerciseSeed } from "./exercises/helpers";
import { OLYMPIC_COMBO_SEEDS } from "./exercises/olympic-combo";
import { PULL_SEEDS } from "./exercises/pull";
import { PUSH_SEEDS } from "./exercises/push";
import { SQUAT_HINGE_SEEDS } from "./exercises/squat-hinge";

export const EXERCISE_SEEDS: readonly ExerciseSeed[] = [
  ...SQUAT_HINGE_SEEDS,
  ...PUSH_SEEDS,
  ...PULL_SEEDS,
  ...OLYMPIC_COMBO_SEEDS,
  ...CORE_GYMNASTIC_SEEDS,
  ...CARDIO_MISC_SEEDS,
];

export const seedExercises = async (db: PrismaClient): Promise<number> => {
  for (const seed of EXERCISE_SEEDS) {
    const defaultMetrics = seed.defaultMetrics as Prisma.InputJsonValue;

    const existing = await db.exerciseLibraryItem.findFirst({
      where: { scope: LibraryScope.SYSTEM, ownerId: null, name: seed.name },
      select: { id: true },
    });

    const update: Prisma.ExerciseLibraryItemUpdateInput = {
      description: seed.description,
      nameAliases: seed.nameAliases,
      primaryMovement: seed.primaryMovement,
      modality: seed.modality,
      equipment: seed.equipment,
      primaryBodyParts: seed.primaryBodyParts,
      secondaryBodyParts: seed.secondaryBodyParts,
      skillLevel: seed.skillLevel,
      defaultMetrics,
      isBenchmark: seed.isBenchmark,
      version: 1,
    };

    if (existing) {
      await db.exerciseLibraryItem.update({ where: { id: existing.id }, data: update });
      continue;
    }

    const create: Prisma.ExerciseLibraryItemUncheckedCreateInput = {
      scope: LibraryScope.SYSTEM,
      ownerId: null,
      name: seed.name,
      nameAliases: seed.nameAliases,
      description: seed.description,
      primaryMovement: seed.primaryMovement,
      modality: seed.modality,
      equipment: seed.equipment,
      primaryBodyParts: seed.primaryBodyParts,
      secondaryBodyParts: seed.secondaryBodyParts,
      skillLevel: seed.skillLevel,
      defaultMetrics,
      isBenchmark: seed.isBenchmark,
      version: 1,
      isDeprecated: false,
    };

    await db.exerciseLibraryItem.create({ data: create });
  }

  return EXERCISE_SEEDS.length;
};
