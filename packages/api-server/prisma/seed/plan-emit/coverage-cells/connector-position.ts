import { Prisma } from "@prisma/client";

import { countBlock } from "./shared";
import { type CoverageCell } from "./types";

const TIME_CAP_CELLS: readonly CoverageCell[] = [
  {
    id: "timeCap.min.noMax",
    category: "timeCap",
    label: "Block.timeCap unit=min, no max",
    required: 1,
    sourceRef: "coverage-matrix §13 min.noMax",
    tally: (db, planId) =>
      countBlock(db, planId, {
        timeCap: { path: ["unit"], equals: "min" },
        AND: [{ timeCap: { path: ["max"], equals: Prisma.AnyNull } }],
      }),
  },
  {
    id: "timeCap.min.withMax",
    category: "timeCap",
    label: "Block.timeCap unit=min, with max",
    required: 1,
    sourceRef: "coverage-matrix §13 min.withMax",
    tally: (db, planId) =>
      countBlock(db, planId, {
        timeCap: { path: ["unit"], equals: "min" },
        AND: [{ timeCap: { path: ["max"], not: { equals: null } } }],
      }),
  },
  {
    id: "timeCap.sec",
    category: "timeCap",
    label: "Block.timeCap unit=sec",
    required: 1,
    sourceRef: "coverage-matrix §13 sec",
    tally: (db, planId) => countBlock(db, planId, { timeCap: { path: ["unit"], equals: "sec" } }),
  },
];

export const CONNECTOR_POSITION_CELLS: readonly CoverageCell[] = [...TIME_CAP_CELLS];
