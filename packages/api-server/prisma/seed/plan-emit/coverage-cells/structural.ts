import { RowKind } from "@prisma/client";

import { countSchemaRow } from "./shared";
import { type CoverageCell } from "./types";

const ROW_KINDS: readonly RowKind[] = [
  RowKind.EXERCISE,
  RowKind.REST,
  RowKind.FOOTNOTE,
  RowKind.STANDALONE_LOAD,
  RowKind.STANDALONE_URL,
  RowKind.PLACEHOLDER,
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
  ...ROW_KINDS.map(rowKindCell),
  ...STANDALONE_URL_CELLS,
];
