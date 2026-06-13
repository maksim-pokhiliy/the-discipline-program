import { Prisma } from "@prisma/client";

import { countSchema } from "./shared";
import { type CoverageCell } from "./types";

const TIME_CAP_CELLS: readonly CoverageCell[] = [
  {
    id: "timeCap.min.noMax",
    category: "timeCap",
    label: "schema repetition.timeCap unit=min, no max",
    required: 1,
    sourceRef: "coverage-matrix §13 min.noMax",
    tally: (db, planId) =>
      countSchema(db, planId, {
        composition: { path: ["repetition", "cap", "unit"], equals: "min" },
        AND: [{ composition: { path: ["repetition", "cap", "max"], equals: Prisma.AnyNull } }],
      }),
  },
  {
    id: "timeCap.min.withMax",
    category: "timeCap",
    label: "schema repetition.timeCap unit=min, with max",
    required: 1,
    sourceRef: "coverage-matrix §13 min.withMax",
    tally: (db, planId) =>
      countSchema(db, planId, {
        composition: { path: ["repetition", "cap", "unit"], equals: "min" },
        AND: [{ composition: { path: ["repetition", "cap", "max"], not: { equals: null } } }],
      }),
  },
];

export const CONNECTOR_POSITION_CELLS: readonly CoverageCell[] = [...TIME_CAP_CELLS];
