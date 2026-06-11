import { RowKind } from "@prisma/client";

import { countSchemaRow } from "./shared";
import { type CoverageCell } from "./types";

const ROW_KINDS: readonly RowKind[] = [
  RowKind.EXERCISE,
  RowKind.REST,
  RowKind.PLACEHOLDER,
  RowKind.REST_SLOT,
];

const rowKindCell = (kind: RowKind): CoverageCell => ({
  id: `rowKind.${kind}`,
  category: "rowKind",
  label: `RowKind = ${kind}`,
  required: 1,
  sourceRef: `coverage-matrix §4 ${kind}`,
  tally: (db, planId) => countSchemaRow(db, planId, { rowKind: kind }),
});

export const STRUCTURAL_CELLS: readonly CoverageCell[] = [...ROW_KINDS.map(rowKindCell)];
