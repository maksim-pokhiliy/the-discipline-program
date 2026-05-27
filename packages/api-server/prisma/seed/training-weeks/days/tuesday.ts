import { type PrismaClient } from "@prisma/client";

import { requireId } from "../../_id-helpers";
import { type SeedCatalogIds } from "../_supporting-catalog";

import { type ArchetypeLookup } from "./_archetype-lookup";

export const seedTuesday = async (
  db: PrismaClient,
  weekId: string,
  catalog: SeedCatalogIds,
  lookupArchetype: ArchetypeLookup,
): Promise<void> => {
  const { exerciseIds, labelIds } = catalog;

  const day = await db.day.create({
    data: {
      weekId,
      dayOfWeek: "TUESDAY",
      labelId: labelIds.main,
      notes: "Pull focus. Belt for top sets only.",
    },
  });

  const session = await db.session.create({
    data: {
      dayId: requireId(day),
      order: 1,
      labelId: null,
      notes: "~ 75 min",
      freezeLoadsAtCreation: false,
    },
  });

  const sessionId = requireId(session);

  await seedStrengthBlock(db, sessionId, exerciseIds, labelIds, lookupArchetype);
  await seedAmrapBlock(db, sessionId, exerciseIds, labelIds, lookupArchetype);
};

const seedStrengthBlock = async (
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
      intensity: { effortPercent: { value: 85 } },
      notes: null,
      labelAssignments: {
        create: [{ labelId: labelIds.strength, order: 1 }],
      },
    },
  });

  const blockId = requireId(block);

  const namedProgramArchetypeId = await lookupArchetype("named-exercise-program");
  const nRoundsArchetypeId = await lookupArchetype("n-rounds");

  await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "NAMED",
      archetypeId: namedProgramArchetypeId,
      header: "Deadlift 5/3/1",
      archetypeParams: {
        archetype: "named-exercise-program",
        params: {
          exerciseId: exerciseIds.deadlift,
          program: {
            programKind: "wave",
            stages: [
              {
                reps: { kind: "count", value: 5 },
                load: { kind: "percentage", value: 75, reference: { scope: "self" } },
              },
              {
                reps: { kind: "count", value: 3 },
                load: { kind: "percentage", value: 85, reference: { scope: "self" } },
              },
              {
                reps: { kind: "max", subForm: "bare" },
                load: { kind: "percentage", value: 95, reference: { scope: "self" } },
              },
            ],
          },
        },
      },
      notes: null,
    },
  });

  const nRoundsSchema = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 2,
      kind: "ATOMIC",
      archetypeId: nRoundsArchetypeId,
      header: null,
      archetypeParams: {
        archetype: "n-rounds",
        params: {
          countForm: "count_times_reps",
          count: 4,
          repsPerSet: 6,
          rest: {
            duration: { value: 75, unit: "sec" },
            scope: "between_sets",
          },
        },
      },
      notes: null,
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: requireId(nRoundsSchema),
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.pendlayRow },
      },
      reps: { kind: "count", value: 6 },
      load: { kind: "percentage", value: 70, reference: { scope: "self" } },
      intensity: { rpe: { value: 8 } },
    },
  });
};

const seedAmrapBlock = async (
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
      intensity: { rpe: { value: 8 } },
      timeCap: { min: 12, unit: "min" },
      notes: null,
      labelAssignments: {
        create: [
          { labelId: labelIds.metcon, order: 1 },
          { labelId: labelIds.conditioning, order: 2 },
        ],
      },
    },
  });

  const amrapArchetypeId = await lookupArchetype("amrap-flat");

  const schema = await db.schema.create({
    data: {
      blockId: requireId(block),
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "ATOMIC",
      archetypeId: amrapArchetypeId,
      header: null,
      archetypeParams: { archetype: "amrap-flat", params: { durationMin: 12 } },
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
        exercise: { form: "atomic", exerciseId: exerciseIds.rowCal },
      },
      reps: { kind: "unit_bound", unit: "sec", value: 15 },
      notes: "15 cal",
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId,
      order: 2,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.dbSnatch },
      },
      reps: { kind: "count", value: 12 },
      load: { kind: "absolute", weight: { variant: "single_arm", valueKg: 22.5 } },
      side: { kind: "alternating", sourceAnnotation: "alt." },
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId,
      order: 3,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.burpee },
      },
      reps: { kind: "count", value: 9 },
      load: { kind: "bodyweight" },
    },
  });
};
