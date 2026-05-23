import { type PrismaClient } from "@prisma/client";

import { requireId } from "../_id-helpers";
import { type SeedCatalogIds } from "../_supporting-catalog";

import { type ArchetypeLookup } from "./_archetype-lookup";

export const seedMondayBlockStrength = async (
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
      intensity: { effortPercent: { value: 80 }, rpe: { value: 7 } },
      notes: "Build to a heavy 5. No missed reps.",
      labelAssignments: {
        create: [
          { labelId: labelIds.strength, order: 1 },
          { labelId: labelIds.lower, order: 2 },
        ],
      },
    },
  });

  const blockId = requireId(block);

  const alternatingGroup = await db.alternatingGroup.create({
    data: { blockId, relationKind: "ALTERNATING_SETS" },
  });

  const altGroupId = requireId(alternatingGroup);

  const backSquatArchetypeId = await lookupArchetype("n-rounds");
  const alternatingSetsArchetypeId = await lookupArchetype("alternating-sets");
  const singleLineBareArchetypeId = await lookupArchetype("single-line-bare");

  const schemaBackSquat = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "ATOMIC",
      archetypeId: backSquatArchetypeId,
      header: null,
      archetypeParams: {
        archetype: "n-rounds",
        params: {
          countForm: "count_times_reps",
          count: 5,
          repsPerSet: 5,
          rest: {
            duration: { value: 150, unit: "sec" },
            scope: "between_sets",
          },
        },
      },
      notes: null,
    },
  });

  const schemaBackSquatId = requireId(schemaBackSquat);

  await db.schemaRow.create({
    data: {
      schemaId: schemaBackSquatId,
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.backSquat },
      },
      reps: { kind: "count", value: 5 },
      load: { kind: "percentage", value: 60, rangeMax: 85, reference: { scope: "self" } },
      tempo: { fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 0, pauseTop: 0 } },
      position: "WITHOUT_BENCH",
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: schemaBackSquatId,
      order: 2,
      rowKind: "FOOTNOTE",
      rowPayload: {
        rowKind: "FOOTNOTE",
        marker: "*",
        target: "each_set",
        content: { elements: [] },
      },
      notes: "Add weight each set — last set must be top set RPE 8.",
    },
  });

  const schemaAltOdd = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: altGroupId,
      order: 2,
      kind: "ATOMIC",
      archetypeId: alternatingSetsArchetypeId,
      header: null,
      archetypeParams: {
        archetype: "alternating-sets",
        params: { setEnumeration: [1, 3, 5] },
      },
      notes: null,
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: requireId(schemaAltOdd),
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.bulgarianSplitSquat },
      },
      reps: { kind: "count", value: 8 },
      load: { kind: "absolute", weight: { variant: "dual", valueKg: 24 } },
      side: { kind: "each_leg", countPerLimb: 8 },
      position: "FROM_BOX",
    },
  });

  const schemaAltEven = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: altGroupId,
      order: 3,
      kind: "ATOMIC",
      archetypeId: alternatingSetsArchetypeId,
      header: null,
      archetypeParams: {
        archetype: "alternating-sets",
        params: { setEnumeration: [2, 4] },
      },
      notes: null,
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: requireId(schemaAltEven),
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.pendlayRow },
      },
      reps: { kind: "count", value: 10 },
      load: { kind: "absolute", weight: { variant: "single_arm", valueKg: 22.5 } },
      side: { kind: "each_arm", countPerLimb: 10 },
    },
  });

  const schemaStandaloneLoad = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 4,
      kind: "ATOMIC",
      archetypeId: singleLineBareArchetypeId,
      header: null,
      archetypeParams: { archetype: "single-line-bare", params: {} },
      notes: null,
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: requireId(schemaStandaloneLoad),
      order: 1,
      rowKind: "STANDALONE_LOAD",
      rowPayload: {
        rowKind: "STANDALONE_LOAD",
        scope: "applies_to_all_preceding_rows",
        load: {
          kind: "absolute",
          weight: { variant: "dual_value", first: 24, second: 16, resolver: "athlete_profile" },
        },
      },
      notes: "M / F resolved per athlete profile.",
    },
  });
};
