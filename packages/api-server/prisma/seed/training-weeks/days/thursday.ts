import { type PrismaClient } from "@prisma/client";

import { requireId } from "../../_id-helpers";
import { type SeedCatalogIds } from "../_supporting-catalog";

import { type ArchetypeLookup } from "./_archetype-lookup";
import { seedThursdaySuperSetBlock } from "./thursday-super-set-block";

export const seedThursday = async (
  db: PrismaClient,
  weekId: string,
  catalog: SeedCatalogIds,
  lookupArchetype: ArchetypeLookup,
): Promise<void> => {
  const { exerciseIds, labelIds } = catalog;

  const day = await db.day.create({
    data: {
      weekId,
      dayOfWeek: "THURSDAY",
      labelId: labelIds.main,
      notes: "Press day · OHP focus",
    },
  });

  const session = await db.session.create({
    data: {
      dayId: requireId(day),
      order: 1,
      labelId: null,
      notes: "~ 80 min",
      freezeLoadsAtCreation: true,
    },
  });

  const sessionId = requireId(session);

  await seedThursdaySuperSetBlock(db, sessionId, exerciseIds, labelIds, lookupArchetype);
  await seedGymnasticsBlock(db, sessionId, exerciseIds, labelIds, lookupArchetype);
  await seedFinisherBlock(db, sessionId, exerciseIds, labelIds, lookupArchetype);
};

const seedGymnasticsBlock = async (
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
        create: [
          { labelId: labelIds.gymnastics, order: 1 },
          { labelId: labelIds.skill, order: 2 },
        ],
      },
    },
  });

  const blockId = requireId(block);

  const nRoundsArchetypeId = await lookupArchetype("n-rounds");
  const placeholderBodyArchetypeId = await lookupArchetype("placeholder-body");

  const nRoundsSchema = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "ATOMIC",
      archetypeId: nRoundsArchetypeId,
      header: null,
      archetypeParams: {
        archetype: "n-rounds",
        params: { countForm: "exact", count: 4 },
      },
      notes: null,
    },
  });

  const nRoundsSchemaId = requireId(nRoundsSchema);

  await db.schemaRow.create({
    data: {
      schemaId: nRoundsSchemaId,
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.hsWalk },
      },
      reps: { kind: "unit_bound", unit: "km", value: 0.015 },
      load: { kind: "bodyweight" },
      notes: "15 ft / round",
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: nRoundsSchemaId,
      order: 2,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: {
          form: "or_alternative",
          orAlternative: {
            primaryExerciseId: exerciseIds.hspu,
            primaryReps: { kind: "count", value: 5 },
            alternativeExerciseId: exerciseIds.pushUp,
            alternativeReps: { kind: "count", value: 10 },
            purpose: "scale_down",
          },
        },
      },
      load: { kind: "bodyweight" },
    },
  });

  const placeholderSchema = await db.schema.create({
    data: {
      blockId,
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 2,
      kind: "HEADERLESS",
      archetypeId: placeholderBodyArchetypeId,
      header: null,
      archetypeParams: { archetype: "placeholder-body", params: {} },
      notes: "pick one — depends on athlete shoulder mobility",
    },
  });

  await db.schemaRow.create({
    data: {
      schemaId: requireId(placeholderSchema),
      order: 1,
      rowKind: "PLACEHOLDER",
      rowPayload: {
        rowKind: "PLACEHOLDER",
        placeholder: {
          placeholderKind: "muscle_group_reference",
          text: "any SHOULDER mobility drill (3 min)",
        },
      },
    },
  });
};

const seedFinisherBlock = async (
  db: PrismaClient,
  sessionId: string,
  exerciseIds: SeedCatalogIds["exerciseIds"],
  labelIds: SeedCatalogIds["labelIds"],
  lookupArchetype: ArchetypeLookup,
): Promise<void> => {
  const block = await db.block.create({
    data: {
      sessionId,
      order: 3,
      intensity: { rpe: { value: 8 } },
      timeCap: { min: 8, unit: "min" },
      notes: null,
      labelAssignments: {
        create: [
          { labelId: labelIds.metcon, order: 1 },
          { labelId: labelIds.pump, order: 2 },
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
      archetypeParams: { archetype: "amrap-flat", params: { durationMin: 8 } },
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
        exercise: {
          form: "compound",
          compound: {
            elements: [
              { exerciseId: exerciseIds.pushUp, reps: { kind: "count", value: 10 } },
              { exerciseId: exerciseIds.airSquat, reps: { kind: "count", value: 15 } },
            ],
          },
        },
      },
      load: { kind: "bodyweight" },
    },
  });
};
