import { type PrismaClient } from "@prisma/client";

import { requireId } from "../../_id-helpers";
import { type SeedCatalogIds } from "../_supporting-catalog";

import { type ArchetypeLookup } from "./_archetype-lookup";

const PENDING_ROW_PLACEHOLDER_CUID = "clz0000000000000000pending";

export const seedThursdaySuperSetBlock = async (
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
      intensity: { effortPercent: { value: 87 } },
      notes: null,
      labelAssignments: {
        create: [{ labelId: labelIds.strength, order: 1 }],
      },
    },
  });

  const superSetArchetypeId = await lookupArchetype("super-set");

  const schema = await db.schema.create({
    data: {
      blockId: requireId(block),
      parentSchemaId: null,
      alternatingGroupId: null,
      order: 1,
      kind: "ATOMIC",
      archetypeId: superSetArchetypeId,
      header: "Super-set A↔B",
      archetypeParams: {
        archetype: "super-set",
        params: {
          rounds: 5,
          pairs: [
            { label: "A", schemaRows: [PENDING_ROW_PLACEHOLDER_CUID] },
            { label: "B", schemaRows: [PENDING_ROW_PLACEHOLDER_CUID] },
          ],
          restBetweenPairs: {
            duration: { value: 60, unit: "sec" },
            scope: "between_rounds",
          },
        },
      },
      notes: null,
    },
  });

  const schemaId = requireId(schema);

  const rowA = await db.schemaRow.create({
    data: {
      schemaId,
      order: 1,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.strictPress },
      },
      reps: { kind: "count", value: 3 },
      load: { kind: "percentage", value: 87, reference: { scope: "self" } },
      notes: "label A",
    },
  });

  const rowB = await db.schemaRow.create({
    data: {
      schemaId,
      order: 2,
      rowKind: "EXERCISE",
      rowPayload: {
        rowKind: "EXERCISE",
        exercise: { form: "atomic", exerciseId: exerciseIds.c2b },
      },
      reps: { kind: "range", min: 5, max: 8 },
      load: { kind: "bodyweight" },
      notes: "label B",
    },
  });

  await db.schema.update({
    where: { id: schemaId },
    data: {
      archetypeParams: {
        archetype: "super-set",
        params: {
          rounds: 5,
          pairs: [
            { label: "A", schemaRows: [requireId(rowA)] },
            { label: "B", schemaRows: [requireId(rowB)] },
          ],
          restBetweenPairs: {
            duration: { value: 60, unit: "sec" },
            scope: "between_rounds",
          },
        },
      },
    },
  });
};
