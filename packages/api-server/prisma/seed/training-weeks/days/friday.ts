import { type PrismaClient } from "@prisma/client";

import { requireId } from "../../_id-helpers";
import { type SeedCatalogIds } from "../_supporting-catalog";

import { type ArchetypeLookup } from "./_archetype-lookup";

export const seedFriday = async (
  db: PrismaClient,
  weekId: string,
  catalog: SeedCatalogIds,
  lookupArchetype: ArchetypeLookup,
): Promise<void> => {
  const { exerciseIds, labelIds } = catalog;

  const day = await db.day.create({
    data: {
      weekId,
      dayOfWeek: "FRIDAY",
      labelId: labelIds.main,
      notes: "Zone 2 + skill",
    },
  });

  const session = await db.session.create({
    data: {
      dayId: requireId(day),
      order: 1,
      labelId: null,
      notes: "~ 60 min",
      freezeLoadsAtCreation: false,
    },
  });

  const sessionId = requireId(session);

  await seedEnduranceBlock(db, sessionId, exerciseIds, labelIds, lookupArchetype);
  await seedSkillBlock(db, sessionId, exerciseIds, labelIds, lookupArchetype);
};

const seedEnduranceBlock = async (
  db: PrismaClient,
  sessionId: string,
  exerciseIds: SeedCatalogIds["exerciseIds"],
  labelIds: SeedCatalogIds["labelIds"],
  lookupArchetype: ArchetypeLookup,
): Promise<void> => {
  const block = await db.block.create({
    data: {
      sessionId,
      order: 1,
      intensity: { hrZone: { zone: "Z2" } },
      notes: "Conversational pace.",
      labelAssignments: {
        create: [{ labelId: labelIds.endurance, order: 1 }],
      },
    },
  });

  const runArchetypeId = await lookupArchetype("run-distance");

  const schema = await db.schema.create({
    data: {
      blockId: requireId(block),
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "HEADERLESS",
      archetypeId: runArchetypeId,
      header: null,
      archetypeParams: {
        archetype: "run-distance",
        params: { modality: "RUN", distance: { unit: "km", value: 6 } },
      },
      notes: null,
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: requireId(schema),
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.run },
      },
      reps: { kind: "unit_bound", unit: "km", value: 6 },
      load: { kind: "bodyweight" },
      intensity: {
        numericPace: {
          value: "5:00",
          distanceUnit: "km",
          paceType: "min_per_distance",
        },
        hrZone: { zone: "Z2" },
      },
    },
  });
};

const seedSkillBlock = async (
  db: PrismaClient,
  sessionId: string,
  exerciseIds: SeedCatalogIds["exerciseIds"],
  labelIds: SeedCatalogIds["labelIds"],
  lookupArchetype: ArchetypeLookup,
): Promise<void> => {
  const block = await db.block.create({
    data: {
      sessionId,
      order: 2,
      notes: null,
      labelAssignments: {
        create: [{ labelId: labelIds.skill, order: 1 }],
      },
    },
  });

  const practiceListArchetypeId = await lookupArchetype("practice-list");

  const schema = await db.schema.create({
    data: {
      blockId: requireId(block),
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "HEADERLESS",
      archetypeId: practiceListArchetypeId,
      header: "Snatch warm-up (15 min)",
      archetypeParams: { archetype: "practice-list", params: {} },
      notes: null,
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: requireId(schema),
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.snatch },
      },
      reps: { kind: "max", subForm: "progressive", progressiveSeed: "3-3-3-2-2-1-1" },
      load: { kind: "unspecified" },
      tempo: { slowEccentric: { durationSec: 3 } },
      notes: "feel the catch position",
    },
  });
};
