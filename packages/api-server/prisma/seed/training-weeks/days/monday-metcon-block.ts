import { type PrismaClient } from "@prisma/client";

import { requireId } from "../../_id-helpers";
import { type SeedCatalogIds } from "../_supporting-catalog";

import { type ArchetypeLookup } from "./_archetype-lookup";

export const seedMondayBlockMetcon = async (
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
      intensity: { rpe: { value: 8 }, hrZone: { zone: "Z4" } },
      timeCap: { min: 12, unit: "min" },
      notes: "Aim for negative splits, last round fastest.",
      labelAssignments: {
        create: [
          { labelId: labelIds.metcon, order: 1 },
          { labelId: labelIds.conditioning, order: 2 },
          { labelId: labelIds.pump, order: 3 },
        ],
      },
    },
  });

  const blockId = requireId(block);

  const ladderArchetypeId = await lookupArchetype("ladder-descending");
  const emomArchetypeId = await lookupArchetype("emom-nested-per-minute");
  const emomSlotArchetypeId = await lookupArchetype("emom-sub-minute-slot");

  await seedFranLadder(db, blockId, exerciseIds, ladderArchetypeId);
  await seedEmomNested(db, blockId, exerciseIds, emomArchetypeId, emomSlotArchetypeId);
};

const seedFranLadder = async (
  db: PrismaClient,
  blockId: string,
  exerciseIds: SeedCatalogIds["exerciseIds"],
  ladderArchetypeId: string,
): Promise<void> => {
  const schema = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "ATOMIC",
      archetypeId: ladderArchetypeId,
      header: '"Fran"',
      archetypeParams: {
        archetype: "ladder-descending",
        params: { steps: [21, 15, 9] },
      },
      notes: null,
    },
  });

  const schemaId = requireId(schema);

  await db.schemaRow.create({
    data: {
      schemaId,
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.thruster },
      },
      reps: { kind: "implicit" },
      media: {
        url: "https://example.com/demo/thruster",
        position: "inline",
        appliesTo: "current_row",
      },
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId,
      order: 2,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.pullUp },
      },
      reps: { kind: "implicit" },
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId,
      order: 3,
      rowKind: "STANDALONE_LOAD",
      rowPayload: {
        rowKind: "STANDALONE_LOAD",
        scope: "applies_to_all_preceding_rows",
        load: {
          kind: "absolute",
          weight: { variant: "dual_value", first: 43, second: 29, resolver: "athlete_profile" },
        },
      },
      notes: "Scaled: 34/20 kg",
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId,
      order: 4,
      rowKind: "STANDALONE_URL",
      rowPayload: {
        rowKind: "STANDALONE_URL",
        url: "https://crossfit.com/workouts/fran",
        wrapped: true,
        appliesTo: "whole_schema",
      },
    },
  });
};

const seedEmomNested = async (
  db: PrismaClient,
  blockId: string,
  exerciseIds: SeedCatalogIds["exerciseIds"],
  emomArchetypeId: string,
  emomSlotArchetypeId: string,
): Promise<void> => {
  const parentSchema = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 2,
      kind: "NESTED",
      archetypeId: emomArchetypeId,
      header: "EMOM 10 — skill / core",
      archetypeParams: {
        archetype: "emom-nested-per-minute",
        params: { durationMin: 10 },
      },
      notes: null,
    },
  });

  const parentId = requireId(parentSchema);

  const subSchemaOdd = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: parentId,
      alternatingGroupId: null,
      order: 1,
      kind: "ATOMIC",
      archetypeId: emomSlotArchetypeId,
      header: "odd minutes",
      archetypeParams: {
        archetype: "emom-sub-minute-slot",
        params: { slot: { kind: "grouped", minutes: [1, 3, 5, 7, 9] } },
      },
      notes: null,
    },
  });

  const subOddId = requireId(subSchemaOdd);

  await db.schemaRow.create({
    data: {
      schemaId: subOddId,
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.t2b },
      },
      reps: { kind: "count", value: 10 },
      intensity: { rpe: { value: 7 } },
      notes: "strict if possible",
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: subOddId,
      order: 2,
      rowKind: "REP_DEFINITION",
      rowPayload: {
        rowKind: "REP_DEFINITION",
        equality: {
          form: "inline_equality",
          totalReps: 10,
          composition: [
            { exerciseId: exerciseIds.t2b, count: 8 },
            { exerciseId: exerciseIds.lSit, count: 2 },
          ],
        },
      },
    },
  });

  const subSchemaEven = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: parentId,
      alternatingGroupId: null,
      order: 2,
      kind: "ATOMIC",
      archetypeId: emomSlotArchetypeId,
      header: "even minutes",
      archetypeParams: {
        archetype: "emom-sub-minute-slot",
        params: { slot: { kind: "grouped", minutes: [2, 4, 6, 8, 10] } },
      },
      notes: null,
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: requireId(subSchemaEven),
      order: 1,
      rowKind: "REST_SLOT",
      rowPayload: { rowKind: "REST_SLOT" },
      notes: "walk · drink · breathe",
    },
  });
};
