import { type PrismaClient } from "@prisma/client";

import { schemaWhere } from "./shared";
import { type CoverageCell } from "./types";

const MODIFIER_CATALOG_FLOOR = 5;

const countRowsWithModifier = async (db: PrismaClient, planId: string): Promise<number> =>
  db.schemaRow.count({
    where: { schema: schemaWhere(planId), modifierAssignments: { some: {} } },
  });

const countRowsWithMultipleModifiers = async (
  db: PrismaClient,
  planId: string,
): Promise<number> => {
  const grouped = await db.rowModifierAssignment.groupBy({
    by: ["rowId"],
    where: { row: { schema: schemaWhere(planId) } },
    _count: { rowId: true },
  });

  return grouped.filter((g) => g._count.rowId >= 2).length;
};

const MODIFIER_CATALOG_CELL: CoverageCell = {
  id: "modifier.catalog",
  category: "modifier",
  label: `Modifier catalog ≥ ${MODIFIER_CATALOG_FLOOR} distinct modifiers`,
  required: MODIFIER_CATALOG_FLOOR,
  sourceRef: "session-primitive D-MODIFIER catalog presence",
  tally: (db) => db.modifier.count(),
};

const MODIFIER_ASSIGNMENT_CELL: CoverageCell = {
  id: "modifier.assignment",
  category: "modifier",
  label: "SchemaRow with ≥1 modifier assignment",
  required: 1,
  sourceRef: "session-primitive D-MODIFIER assignment present",
  tally: countRowsWithModifier,
};

const MODIFIER_MULTI_ASSIGNMENT_CELL: CoverageCell = {
  id: "modifier.multiAssignment",
  category: "modifier",
  label: "SchemaRow with ≥2 ordered modifier assignments",
  required: 1,
  sourceRef: "session-primitive D-MODIFIER ordered multi-ref",
  tally: countRowsWithMultipleModifiers,
};

export const EXERCISE_CELLS: readonly CoverageCell[] = [
  MODIFIER_CATALOG_CELL,
  MODIFIER_ASSIGNMENT_CELL,
  MODIFIER_MULTI_ASSIGNMENT_CELL,
];
