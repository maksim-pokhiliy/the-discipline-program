import { Prisma } from "@prisma/client";

import { countMultiMemberGroups, countSchema, STRUCTURAL_PARALLEL_FLOOR } from "./shared";
import { type CoverageCell } from "./types";

const COMPOSITION_PRESENT_FLOOR = 40;

const REPETITION_KINDS = ["count", "ladder", "timeCap", "cadence", "interval"] as const;

const repetitionKindCell = (kind: (typeof REPETITION_KINDS)[number]): CoverageCell => ({
  id: `repetition.kind.${kind}`,
  category: "repetition.kind",
  label: `composition.repetition.kind = ${kind}`,
  required: 1,
  sourceRef: `compose-axis repetition.${kind}`,
  tally: (db, planId) =>
    countSchema(db, planId, { composition: { path: ["repetition", "kind"], equals: kind } }),
});

const STRUCTURAL_PARALLEL_CELL: CoverageCell = {
  id: "structural.parallel",
  category: "composition",
  label: "SchemaGroup with ≥2 members (explicit parallel/alternating group)",
  required: STRUCTURAL_PARALLEL_FLOOR,
  sourceRef: "session-primitive DR-W2-1",
  tally: countMultiMemberGroups,
};

const REST_PRESENT_CELL: CoverageCell = {
  id: "rest.present",
  category: "rest",
  label: "composition.rest present (non-null rest axis)",
  required: 1,
  sourceRef: "compose-axis rest.present",
  tally: (db, planId) =>
    countSchema(db, planId, { composition: { path: ["rest"], not: { equals: null } } }),
};

export const COMPOSITION_CELLS: readonly CoverageCell[] = [
  {
    id: "composition.present",
    category: "composition",
    label: "Demo Plan schema carries a non-null composition bundle",
    required: COMPOSITION_PRESENT_FLOOR,
    sourceRef: "algebra-spec §3 Gauntlet",
    tally: (db, planId) => countSchema(db, planId, { composition: { not: Prisma.AnyNull } }),
  },
  ...REPETITION_KINDS.map(repetitionKindCell),
  STRUCTURAL_PARALLEL_CELL,
  REST_PRESENT_CELL,
];
