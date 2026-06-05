import { Prisma } from "@prisma/client";

import { countBlock, countDay, countSchema, countSession } from "./shared";
import { type CoverageCell } from "./types";

const SUB_SCHEMA_FLOOR = 25;

const ENTITY_INVARIANT_CELLS: readonly CoverageCell[] = [
  {
    id: "entity.restDay",
    category: "entity-invariants",
    label: "Day with rest label + no sessions",
    required: 1,
    sourceRef: "coverage-matrix §2 rest-day",
    tally: (db, planId) =>
      countDay(db, planId, {
        label: { rest: true },
        sessions: { none: {} },
      }),
  },
  {
    id: "entity.activeDay",
    category: "entity-invariants",
    label: "Day with null label (active day)",
    required: 1,
    sourceRef: "coverage-matrix §2 active-day",
    tally: (db, planId) => countDay(db, planId, { labelId: null }),
  },
  {
    id: "entity.emptyBlock",
    category: "entity-invariants",
    label: "Block with schemas = []",
    required: 1,
    sourceRef: "coverage-matrix §2 empty-block",
    tally: (db, planId) => countBlock(db, planId, { schemas: { none: {} } }),
  },
  {
    id: "entity.implicitBlock",
    category: "entity-invariants",
    label: "Block with labelAssignments = []",
    required: 1,
    sourceRef: "coverage-matrix §2 implicit-block",
    tally: (db, planId) => countBlock(db, planId, { labelAssignments: { none: {} } }),
  },
  {
    id: "entity.singleLabelBlock",
    category: "entity-invariants",
    label: "Block with exactly 1 label assignment",
    required: 1,
    sourceRef: "coverage-matrix §2 single-label-block",
    tally: async (db, planId) => {
      const grouped = await db.blockLabelAssignment.groupBy({
        by: ["blockId"],
        where: { block: { session: { day: { week: { planId } } } } },
        _count: { blockId: true },
      });

      return grouped.filter((g) => g._count.blockId === 1).length;
    },
  },
  {
    id: "entity.multiLabelBlock",
    category: "entity-invariants",
    label: "Block with ≥2 label assignments",
    required: 1,
    sourceRef: "coverage-matrix §2 multi-label-block",
    tally: async (db, planId) => {
      const grouped = await db.blockLabelAssignment.groupBy({
        by: ["blockId"],
        where: { block: { session: { day: { week: { planId } } } } },
        _count: { blockId: true },
      });

      return grouped.filter((g) => g._count.blockId >= 2).length;
    },
  },
  {
    id: "entity.blockIntensity",
    category: "entity-invariants",
    label: "Block with intensity Json set",
    required: 1,
    sourceRef: "coverage-matrix §2 block-intensity",
    tally: (db, planId) => countBlock(db, planId, { intensity: { not: Prisma.AnyNull } }),
  },
  {
    id: "entity.blockTimeCap",
    category: "entity-invariants",
    label: "Block with timeCap Json set",
    required: 1,
    sourceRef: "coverage-matrix §2 block-timeCap",
    tally: (db, planId) => countBlock(db, planId, { timeCap: { not: Prisma.AnyNull } }),
  },
  {
    id: "entity.schemaNotes",
    category: "entity-invariants",
    label: "Schema with notes set",
    required: 1,
    sourceRef: "coverage-matrix §2 schema-notes",
    tally: (db, planId) => countSchema(db, planId, { NOT: { notes: null } }),
  },
  {
    id: "entity.schemaIntensity",
    category: "entity-invariants",
    label: "Schema with intensity set",
    required: 1,
    sourceRef: "coverage-matrix §2 schema-intensity",
    tally: (db, planId) => countSchema(db, planId, { intensity: { not: Prisma.AnyNull } }),
  },
  {
    id: "entity.subSchemas",
    category: "entity-invariants",
    label: "Schema with parentSchemaId (sub-schema)",
    required: SUB_SCHEMA_FLOOR,
    sourceRef: "coverage-matrix §2 sub-schemas",
    tally: (db, planId) => countSchema(db, planId, { NOT: { parentSchemaId: null } }),
  },
  {
    id: "entity.alternatingGroup",
    category: "entity-invariants",
    label: "Schema with arrangement:parallel presence",
    required: 2,
    sourceRef: "coverage-matrix §2 arrangement:parallel presence",
    tally: (db, planId) =>
      countSchema(db, planId, {
        composition: { path: ["arrangement", "kind"], equals: "parallel" },
      }),
  },
  {
    id: "entity.sessionFreeze",
    category: "entity-invariants",
    label: "Session with freezeLoadsAtCreation = true",
    required: 1,
    sourceRef: "coverage-matrix §2 session-freeze",
    tally: (db, planId) => countSession(db, planId, { freezeLoadsAtCreation: true }),
  },
  {
    id: "entity.labeledSession",
    category: "entity-invariants",
    label: "Session with a label (e.g. 1ST SESSION)",
    required: 1,
    sourceRef: "coverage-matrix §2 session-label",
    tally: (db, planId) => countSession(db, planId, { NOT: { labelId: null } }),
  },
];

export const MISC_CELLS: readonly CoverageCell[] = ENTITY_INVARIANT_CELLS;
