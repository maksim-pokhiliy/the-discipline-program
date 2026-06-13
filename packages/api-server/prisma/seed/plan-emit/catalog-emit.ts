import { type PrismaClient } from "@prisma/client";

import { requireId } from "../_id-helpers";
import { exerciseCuid } from "../plan-data/builder";
import { type CanonicalSeed } from "../plan-data/canonical-schema";

import { type RefResolver } from "./ref-resolver";

const CATALOG_EMIT_BATCH_SIZE = 10;

type CatalogCounts = {
  exerciseCount: number;
  labelCount: number;
  modifierCount: number;
};

const emitInBatches = async <T>(
  entries: ReadonlyArray<T>,
  emit: (entry: T) => Promise<void>,
): Promise<void> => {
  for (let i = 0; i < entries.length; i += CATALOG_EMIT_BATCH_SIZE) {
    const batch = entries.slice(i, i + CATALOG_EMIT_BATCH_SIZE);

    await Promise.all(batch.map(emit));
  }
};

const emitExercise = async (
  db: PrismaClient,
  entry: CanonicalSeed["catalog"]["exercises"][number],
  resolver: RefResolver,
): Promise<void> => {
  const row = await db.exercise.create({
    data: {
      id: exerciseCuid(entry.canonicalName),
      canonicalName: entry.canonicalName,
      canonicalNameLower: entry.canonicalName.toLowerCase(),
      primaryEquipment: entry.primaryEquipment,
      movementTypeTagPrimary: entry.movementTypeTagPrimary,
      movementTypeTagSecondary: entry.movementTypeTagSecondary,
      defaultDemoUrls: [...entry.defaultDemoUrls],
      canonicalCompoundType: entry.canonicalCompoundType,
      placeholderFlag: entry.placeholderFlag,
      movementFamily: entry.movementFamily,
      aliases: entry.aliases,
      notes: entry.notes,
    },
  });

  resolver.setExercise(entry.ref, requireId(row));
};

const emitLabel = async (
  db: PrismaClient,
  entry: CanonicalSeed["catalog"]["labels"][number],
  resolver: RefResolver,
): Promise<void> => {
  const row = await db.label.create({
    data: {
      name: entry.name,
      nameLower: entry.name.toLowerCase(),
      applicableLevels: entry.applicableLevels,
      rest: entry.rest,
      notes: entry.notes,
    },
  });

  resolver.setLabel(entry.ref, requireId(row));
};

const emitModifier = async (
  db: PrismaClient,
  entry: CanonicalSeed["catalog"]["modifiers"][number],
  resolver: RefResolver,
): Promise<void> => {
  const row = await db.modifier.create({
    data: {
      name: entry.name,
      nameLower: entry.name.toLowerCase(),
      ...(entry.notes !== null && { notes: entry.notes }),
    },
  });

  resolver.setModifier(entry.ref, requireId(row));
};

export const seedCanonicalCatalog = async (
  db: PrismaClient,
  catalog: CanonicalSeed["catalog"],
  resolver: RefResolver,
): Promise<CatalogCounts> => {
  await emitInBatches(catalog.exercises, (entry) => emitExercise(db, entry, resolver));
  await emitInBatches(catalog.labels, (entry) => emitLabel(db, entry, resolver));
  await emitInBatches(catalog.modifiers, (entry) => emitModifier(db, entry, resolver));

  const counts: CatalogCounts = {
    exerciseCount: catalog.exercises.length,
    labelCount: catalog.labels.length,
    modifierCount: catalog.modifiers.length,
  };

  console.log(
    `  Canonical catalog: ${counts.exerciseCount} exercises + ${counts.labelCount} labels + ${counts.modifierCount} modifiers`,
  );

  return counts;
};
