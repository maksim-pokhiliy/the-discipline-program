import { type PrismaClient } from "@prisma/client";

import { requireId } from "../_id-helpers";
import { type SeedCatalogIds } from "../_supporting-catalog";

import { type ArchetypeLookup } from "./_archetype-lookup";

export const seedSaturday = async (
  db: PrismaClient,
  weekId: string,
  catalog: SeedCatalogIds,
  lookupArchetype: ArchetypeLookup,
): Promise<void> => {
  const { exerciseIds, labelIds } = catalog;

  const day = await db.day.create({
    data: {
      weekId,
      dayOfWeek: "SATURDAY",
      labelId: labelIds.main,
      notes: "Partner day — bring a friend",
    },
  });

  const session = await db.session.create({
    data: {
      dayId: requireId(day),
      order: 1,
      labelId: null,
      notes: "~ 45 min",
      freezeLoadsAtCreation: false,
    },
  });

  const sessionId = requireId(session);

  const block = await db.block.create({
    data: {
      sessionId,
      order: 1,
      intensity: { rpe: { value: 8 } },
      timeCap: { min: 25, unit: "min" },
      notes: "Split as you go.",
      labelAssignments: {
        create: [
          { labelId: labelIds.metcon, order: 1 },
          { labelId: labelIds.partner, order: 2 },
        ],
      },
    },
  });

  const nRoundsArchetypeId = await lookupArchetype("n-rounds");

  const schema = await db.schema.create({
    data: {
      blockId: requireId(block),
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "ATOMIC",
      archetypeId: nRoundsArchetypeId,
      header: 'Partner "DT"',
      archetypeParams: {
        archetype: "n-rounds",
        params: { countForm: "exact", count: 5 },
      },
      notes: null,
    },
  });

  const dualValueLoad = {
    kind: "absolute",
    weight: { variant: "dual_value", first: 70, second: 47, resolver: "athlete_profile" },
  } as const;

  await db.schemaRow.create({
    data: {
      schemaId: requireId(schema),
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: {
          form: "sandwich",
          sandwich: {
            opening: { exerciseId: exerciseIds.deadlift, reps: { kind: "count", value: 12 } },
            middle: { exerciseId: exerciseIds.hangClean, reps: { kind: "count", value: 9 } },
            closing: { exerciseId: exerciseIds.pushJerk, reps: { kind: "count", value: 6 } },
            sharedModifiers: { load: dualValueLoad },
          },
        },
      },
      load: dualValueLoad,
    },
  });
};
