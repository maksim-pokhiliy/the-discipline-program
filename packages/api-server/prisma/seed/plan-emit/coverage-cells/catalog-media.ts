import { Prisma, RowKind } from "@prisma/client";

import { countSchemaRow } from "./shared";
import { type CoverageCell } from "./types";

const CATALOG_EXERCISE_FLOOR = 149;
const CATALOG_LABEL_FLOOR = 20;

const CATALOG_CELLS: readonly CoverageCell[] = [
  {
    id: "catalog.exercise",
    category: "catalog",
    label: `Exercise catalog ≥ ${CATALOG_EXERCISE_FLOOR} canonical names`,
    required: CATALOG_EXERCISE_FLOOR,
    sourceRef: "coverage-matrix §1 Catalog.exercise",
    tally: (db) => db.exercise.count(),
  },
  {
    id: "catalog.label",
    category: "catalog",
    label: `Label catalog ≥ ${CATALOG_LABEL_FLOOR} distinct labels`,
    required: CATALOG_LABEL_FLOOR,
    sourceRef: "coverage-matrix §1 Catalog.label",
    tally: (db) => db.label.count(),
  },
];

const MEDIA_PRESENT_CELL: CoverageCell = {
  id: "mediaReference.present",
  category: "mediaReference",
  label: "Row with a media reference (non-null media.url)",
  required: 1,
  sourceRef: "coverage-matrix §19 media present",
  tally: (db, planId) => countSchemaRow(db, planId, { media: { not: Prisma.AnyNull } }),
};

const COMPOUND_FORM_CELLS: readonly CoverageCell[] = [
  {
    id: "compoundForm.compoundRow",
    category: "compoundForm",
    label: "CompoundRow (exercise.form = compound)",
    required: 1,
    sourceRef: "coverage-matrix §21 CompoundRow",
    tally: (db, planId) =>
      countSchemaRow(db, planId, {
        rowKind: RowKind.EXERCISE,
        rowPayload: { path: ["exercise", "form"], equals: "compound" },
      }),
  },
  {
    id: "compoundForm.compoundRow.sharedModifiers",
    category: "compoundForm",
    label: "CompoundRow.sharedModifiers present",
    required: 1,
    sourceRef: "coverage-matrix §21 CompoundRow.sharedModifiers",
    tally: (db, planId) =>
      countSchemaRow(db, planId, {
        rowKind: RowKind.EXERCISE,
        rowPayload: { path: ["exercise", "compound", "sharedModifiers"], not: { equals: null } },
      }),
  },
];

const PER_SET_SUBSTITUTION_CELL: CoverageCell = {
  id: "perSetSubstitution.assignments",
  category: "perSetSubstitution",
  label: "PLACEHOLDER row with per-set substitution assignments",
  required: 1,
  sourceRef: "coverage-matrix §20 placeholder + per-set assignments",
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.PLACEHOLDER,
      rowPayload: { path: ["placeholder", "perSetAssignments"], not: { equals: null } },
    }),
};

export const CATALOG_MEDIA_CELLS: readonly CoverageCell[] = [
  ...CATALOG_CELLS,
  MEDIA_PRESENT_CELL,
  ...COMPOUND_FORM_CELLS,
  PER_SET_SUBSTITUTION_CELL,
];
