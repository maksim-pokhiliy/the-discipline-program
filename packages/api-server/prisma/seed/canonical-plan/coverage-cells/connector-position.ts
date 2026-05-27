import { Prisma } from "@prisma/client";

import { countBlock, countSchema } from "./shared";
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

const CONNECTOR_FORMS: readonly string[] = ["then", "then_dots", "then_n_rounds"];

const connectorFormCell = (form: string): CoverageCell => ({
  id: `connectorForm.${form}`,
  category: "connectorForm",
  label: `Schema.trailingConnector.form = ${form}`,
  required: 1,
  sourceRef: `coverage-matrix §15 ${form}`,
  tally: (db, planId) =>
    countSchema(db, planId, { trailingConnector: { path: ["form"], equals: form } }),
});

const PROGRAM_KINDS: readonly string[] = ["drop_set", "wave", "cluster"];

const programKindCell = (kind: string): CoverageCell => ({
  id: `stagedProgram.${kind}`,
  category: "stagedProgram.kind",
  label: `StagedProgram.programKind = ${kind}`,
  required: 1,
  sourceRef: `coverage-matrix §17 ${kind}`,
  tally: (db, planId) =>
    countSchema(db, planId, {
      archetype: { name: "named-exercise-program" },
      archetypeParams: { path: ["params", "program", "programKind"], equals: kind },
    }),
});

const SLOT_KINDS: readonly string[] = ["single", "grouped"];

const slotKindCell = (kind: string): CoverageCell => ({
  id: `slotSpec.${kind}`,
  category: "slotSpec.kind",
  label: `SlotSpec.kind = ${kind} (emom-sub-minute-slot)`,
  required: 1,
  sourceRef: `coverage-matrix §18 ${kind}`,
  tally: (db, planId) =>
    countSchema(db, planId, {
      archetype: { name: "emom-sub-minute-slot" },
      archetypeParams: { path: ["params", "slot", "kind"], equals: kind },
    }),
});

export const CONNECTOR_POSITION_CELLS: readonly CoverageCell[] = [
  ...TIME_CAP_CELLS,
  ...CONNECTOR_FORMS.map(connectorFormCell),
  ...PROGRAM_KINDS.map(programKindCell),
  ...SLOT_KINDS.map(slotKindCell),
];
