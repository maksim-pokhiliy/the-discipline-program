import { RowKind, SchemaKind } from "@prisma/client";

import { countSchema, countSchemaRow } from "./shared";
import { type CoverageCell } from "./types";

const ARCHETYPE_NAMES: readonly string[] = [
  "n-rounds",
  "named-themed-sets",
  "ladder-descending",
  "emom-sub-minute-slot",
  "parallel-ladders-descending",
  "single-line-with-then-connector",
  "run-distance",
  "flat-list-headerless",
  "named-exercise-program",
  "single-line-bare",
  "pull-ups-dips-cycle",
  "emom-nested-per-minute",
  "placeholder-body",
  "composite-rounds-with-rest",
  "ladder-ascending",
  "single-line-total-counter",
  "composite-intervals-then-rounds",
  "nested-rounds-over-rounds",
  "nested-rounds-over-parallel-ladder",
  "alternating-sets",
  "time-window-outer",
  "parallel-ladders-mixed-direction",
  "nested-composite-rounds-over-ladder",
  "composite-intervals-work-rest-progressive",
  "url-only-body",
  "ladder-vertex-down-pyramid",
  "ladder-spike",
  "amrap-flat",
  "parallel-pyramids",
  "composite-intervals-work-rest-fixed",
  "composite-intervals-on-off-max-tail",
  "composite-rolling-rounds",
  "practice-list",
  "super-set",
];

const archetypeCell = (name: string): CoverageCell => ({
  id: `archetype.${name}`,
  category: "archetype",
  label: `Archetype = ${name}`,
  required: name === "alternating-sets" ? 2 : 1,
  sourceRef: name === "super-set" ? "phase-7-accessory-super-set" : `coverage-matrix §3 ${name}`,
  tally: (db, planId) => countSchema(db, planId, { archetype: { name } }),
});

const ROW_KINDS: readonly RowKind[] = [
  RowKind.EXERCISE,
  RowKind.REST,
  RowKind.FOOTNOTE,
  RowKind.STANDALONE_LOAD,
  RowKind.STANDALONE_URL,
  RowKind.PLACEHOLDER,
  RowKind.INNER_LADDER_MARKER,
  RowKind.REP_DEFINITION,
  RowKind.REST_SLOT,
];

const rowKindCell = (kind: RowKind): CoverageCell => ({
  id: `rowKind.${kind}`,
  category: "rowKind",
  label: `RowKind = ${kind}`,
  required: kind === RowKind.STANDALONE_URL ? 2 : 1,
  sourceRef: `coverage-matrix §4 ${kind}`,
  tally: (db, planId) => countSchemaRow(db, planId, { rowKind: kind }),
});

const SCHEMA_KINDS: readonly SchemaKind[] = [
  SchemaKind.ATOMIC,
  SchemaKind.HEADERLESS,
  SchemaKind.NESTED,
  SchemaKind.NAMED,
  SchemaKind.COMPOSITE,
];

const schemaKindCell = (kind: SchemaKind): CoverageCell => ({
  id: `schemaKind.${kind}`,
  category: "schemaKind",
  label: `SchemaKind = ${kind}`,
  required: 1,
  sourceRef: `coverage-matrix §14 ${kind}`,
  tally: (db, planId) => countSchema(db, planId, { kind }),
});

const STANDALONE_URL_CELLS: readonly CoverageCell[] = [
  {
    id: "rowKind.STANDALONE_URL.wrapped",
    category: "rowKind",
    label: "STANDALONE_URL with rowPayload.wrapped = true",
    required: 1,
    sourceRef: "coverage-matrix §4 STANDALONE_URL wrapped",
    tally: (db, planId) =>
      countSchemaRow(db, planId, {
        rowKind: RowKind.STANDALONE_URL,
        rowPayload: { path: ["wrapped"], equals: true },
      }),
  },
  {
    id: "rowKind.STANDALONE_URL.bare",
    category: "rowKind",
    label: "STANDALONE_URL with rowPayload.wrapped = false",
    required: 1,
    sourceRef: "coverage-matrix §4 STANDALONE_URL bare",
    tally: (db, planId) =>
      countSchemaRow(db, planId, {
        rowKind: RowKind.STANDALONE_URL,
        rowPayload: { path: ["wrapped"], equals: false },
      }),
  },
];

export const STRUCTURAL_CELLS: readonly CoverageCell[] = [
  ...ARCHETYPE_NAMES.map(archetypeCell),
  ...ROW_KINDS.map(rowKindCell),
  ...STANDALONE_URL_CELLS,
  ...SCHEMA_KINDS.map(schemaKindCell),
];
