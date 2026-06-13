import { Prisma } from "@prisma/client";

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

export const CATALOG_MEDIA_CELLS: readonly CoverageCell[] = [...CATALOG_CELLS, MEDIA_PRESENT_CELL];
