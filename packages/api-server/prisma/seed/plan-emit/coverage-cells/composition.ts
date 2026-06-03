import { Prisma } from "@prisma/client";

import { countSchema } from "./shared";
import { type CoverageCell } from "./types";

export const COMPOSITION_CELLS: readonly CoverageCell[] = [
  {
    id: "composition.present",
    category: "composition",
    label: "Demo Plan schema carries a non-null composition bundle",
    required: 5,
    sourceRef: "algebra-spec §3 Gauntlet",
    tally: (db, planId) => countSchema(db, planId, { composition: { not: Prisma.AnyNull } }),
  },
];
