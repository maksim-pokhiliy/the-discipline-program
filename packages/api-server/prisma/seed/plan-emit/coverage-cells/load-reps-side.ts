import { countSchemaRow } from "./shared";
import { type CoverageCell } from "./types";

const LOAD_KINDS: readonly string[] = ["absolute", "percentage", "bodyweight", "byProfile"];

const loadKindCell = (kind: string): CoverageCell => ({
  id: `load.kind.${kind}`,
  category: "load.kind",
  label: `Load.kind = ${kind}`,
  required: 1,
  sourceRef: `coverage-matrix §6.1 ${kind}`,
  tally: (db, planId) => countSchemaRow(db, planId, { load: { path: ["kind"], equals: kind } }),
});

const ABSOLUTE_COUNTS: readonly number[] = [1, 2];

const absoluteCountCell = (count: number): CoverageCell => ({
  id: `load.absolute.count.${count}`,
  category: "load.kind",
  label: `Load.absolute.count = ${count}`,
  required: 1,
  sourceRef: `coverage-matrix §6.1 absolute count=${count}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      load: { path: ["kind"], equals: "absolute" },
      AND: [{ load: { path: ["count"], equals: count } }],
    }),
});

const BY_PROFILE_ENTRIES_CELL: CoverageCell = {
  id: "load.byProfile.entries",
  category: "load.kind",
  label: "Load.byProfile.entries present (label→kg list)",
  required: 1,
  sourceRef: "coverage-matrix §6.1 byProfile entries",
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      load: { path: ["kind"], equals: "byProfile" },
      AND: [{ load: { path: ["entries"], not: { equals: null } } }],
    }),
};

const PERCENTAGE_SCOPES: readonly string[] = ["self", "other_exercise"];

const percentageScopeCell = (scope: string): CoverageCell => ({
  id: `percentageReference.scope.${scope}`,
  category: "percentageReference.scope",
  label: `PercentageReference.scope = ${scope}`,
  required: 1,
  sourceRef: `coverage-matrix §6.3 ${scope}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      load: { path: ["reference", "scope"], equals: scope },
    }),
});

const REP_KINDS: readonly string[] = ["count", "range", "unit_bound", "max"];

const repKindCell = (kind: string): CoverageCell => ({
  id: `repNotation.kind.${kind}`,
  category: "repNotation.kind",
  label: `RepNotation.kind = ${kind}`,
  required: 1,
  sourceRef: `coverage-matrix §7 ${kind}`,
  tally: (db, planId) => countSchemaRow(db, planId, { reps: { path: ["kind"], equals: kind } }),
});

const UNIT_BOUND_FORMS: readonly { form: "value" | "range" }[] = [
  { form: "value" },
  { form: "range" },
];

const unitBoundFormCell = ({ form }: { form: "value" | "range" }): CoverageCell => ({
  id: `repNotation.unit_bound.${form}`,
  category: "repNotation.kind",
  label: `RepNotation.unit_bound has ${form}-form`,
  required: 1,
  sourceRef: `coverage-matrix §7 unit_bound ${form}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      reps: { path: ["kind"], equals: "unit_bound" },
      AND: [{ reps: { path: [form], not: { equals: null } } }],
    }),
});

const PER_LIMB_KINDS: readonly string[] = ["each_leg", "each_arm", "explicit_split", "alternating"];

const perLimbCell = (kind: string): CoverageCell => ({
  id: `perLimb.kind.${kind}`,
  category: "perLimb.kind",
  label: `PerLimbDistribution.kind = ${kind}`,
  required: kind === "explicit_split" ? 2 : 1,
  sourceRef: `coverage-matrix §8 ${kind}`,
  tally: (db, planId) => countSchemaRow(db, planId, { side: { path: ["kind"], equals: kind } }),
});

const EXPLICIT_SPLIT_SIDES: readonly string[] = ["left", "right"];

const explicitSplitSideCell = (side: string): CoverageCell => ({
  id: `perLimb.explicit_split.${side}`,
  category: "perLimb.kind",
  label: `PerLimbDistribution.explicit_split.side = ${side}`,
  required: 1,
  sourceRef: `coverage-matrix §8 explicit_split ${side}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      side: { path: ["kind"], equals: "explicit_split" },
      AND: [{ side: { path: ["side"], equals: side } }],
    }),
});

export const LOAD_REPS_SIDE_CELLS: readonly CoverageCell[] = [
  ...LOAD_KINDS.map(loadKindCell),
  ...ABSOLUTE_COUNTS.map(absoluteCountCell),
  BY_PROFILE_ENTRIES_CELL,
  ...PERCENTAGE_SCOPES.map(percentageScopeCell),
  ...REP_KINDS.map(repKindCell),
  ...UNIT_BOUND_FORMS.map(unitBoundFormCell),
  ...PER_LIMB_KINDS.map(perLimbCell),
  ...EXPLICIT_SPLIT_SIDES.map(explicitSplitSideCell),
];
