import { Prisma } from "@prisma/client";

import { countSchema, countSchemaRow } from "./shared";
import { type CoverageCell } from "./types";

const TEMPO_PRESENT_CELL: CoverageCell = {
  id: "tempoModifier.fullTempo",
  category: "tempoModifier.axis",
  label: "SchemaRow with a 4-digit tempo set",
  required: 1,
  sourceRef: "coverage-matrix §9 fullTempo",
  tally: (db, planId) => countSchemaRow(db, planId, { tempo: { not: Prisma.AnyNull } }),
};

const INTENSITY_DIMS: readonly { dim: string; required: number }[] = [
  { dim: "effortPercent", required: 2 },
  { dim: "rpe", required: 1 },
  { dim: "pace", required: 1 },
  { dim: "hrZone", required: 1 },
  { dim: "numericPace", required: 1 },
];

const intensityDimCell = ({ dim, required }: { dim: string; required: number }): CoverageCell => ({
  id: `intensity.dim.${dim}`,
  category: "intensity.dim",
  label: `Intensity.${dim} set on schema`,
  required,
  sourceRef: `coverage-matrix §11 ${dim}`,
  tally: (db, planId) =>
    countSchema(db, planId, { intensity: { path: [dim], not: { equals: null } } }),
});

const EFFORT_FORMS: readonly { form: "value" | "range" }[] = [{ form: "value" }, { form: "range" }];

const effortFormCell = ({ form }: { form: "value" | "range" }): CoverageCell => ({
  id: `intensity.effortPercent.${form}`,
  category: "intensity.dim",
  label: `Intensity.effortPercent ${form}-form`,
  required: 1,
  sourceRef: `coverage-matrix §11 effortPercent ${form}`,
  tally: (db, planId) =>
    countSchema(db, planId, {
      intensity: { path: ["effortPercent", form], not: { equals: null } },
    }),
});

const PACE_VALUES: readonly string[] = ["easy", "moderate", "hard", "recovery"];

const paceValueCell = (pace: string): CoverageCell => ({
  id: `intensity.pace.${pace}`,
  category: "intensity.dim",
  label: `Intensity.pace = ${pace}`,
  required: 1,
  sourceRef: `coverage-matrix §11 pace ${pace}`,
  tally: (db, planId) => countSchema(db, planId, { intensity: { path: ["pace"], equals: pace } }),
});

const HR_ZONES: readonly string[] = ["Z2", "Z3"];

const hrZoneCell = (zone: string): CoverageCell => ({
  id: `intensity.hrZone.${zone}`,
  category: "intensity.dim",
  label: `Intensity.hrZone.zone = ${zone}`,
  required: 1,
  sourceRef: `coverage-matrix §11 hrZone ${zone}`,
  tally: (db, planId) =>
    countSchema(db, planId, { intensity: { path: ["hrZone", "zone"], equals: zone } }),
});

const NUMERIC_PACE_TYPES: readonly string[] = ["min_per_distance"];

const numericPaceTypeCell = (paceType: string): CoverageCell => ({
  id: `intensity.numericPace.${paceType}`,
  category: "intensity.dim",
  label: `Intensity.numericPace.paceType = ${paceType}`,
  required: 1,
  sourceRef: `coverage-matrix §11 numericPace ${paceType}`,
  tally: (db, planId) =>
    countSchema(db, planId, { intensity: { path: ["numericPace", "paceType"], equals: paceType } }),
});

const REST_SCOPES: readonly string[] = [
  "between_sets",
  "between_rounds",
  "between_intervals",
  "after_specific_set",
];

const restScopeCell = (scope: string): CoverageCell => ({
  id: `restSpec.scope.${scope}`,
  category: "restSpec.scope",
  label: `composition.rest.scope = ${scope}`,
  required: 1,
  sourceRef: `coverage-matrix §12 scope ${scope}`,
  tally: (db, planId) =>
    countSchema(db, planId, { composition: { path: ["rest", "scope"], equals: scope } }),
});

const REST_UNITS: readonly string[] = ["sec", "min", "range_sec", "range_min"];

const restUnitCell = (unit: string): CoverageCell => ({
  id: `restSpec.unit.${unit}`,
  category: "restSpec.unit",
  label: `composition.rest.duration.unit = ${unit}`,
  required: 1,
  sourceRef: `coverage-matrix §12 unit ${unit}`,
  tally: (db, planId) =>
    countSchema(db, planId, {
      composition: { path: ["rest", "duration", "unit"], equals: unit },
    }),
});

const REST_QUALIFIERS: readonly string[] = ["until_recovery", "fixed", "range"];

const restQualifierCell = (qualifier: string): CoverageCell => ({
  id: `restSpec.qualifier.${qualifier}`,
  category: "restSpec.qualifier",
  label: `composition.rest.qualifier = ${qualifier}`,
  required: 1,
  sourceRef: `coverage-matrix §12 qualifier ${qualifier}`,
  tally: (db, planId) =>
    countSchema(db, planId, { composition: { path: ["rest", "qualifier"], equals: qualifier } }),
});

const REST_SET_INDEX_CELL: CoverageCell = {
  id: "restSpec.setIndex",
  category: "restSpec.scope",
  label: "composition.rest.setIndex set (after_specific_set scope)",
  required: 1,
  sourceRef: "coverage-matrix §12 setIndex",
  tally: (db, planId) =>
    countSchema(db, planId, { composition: { path: ["rest", "setIndex"], not: { equals: null } } }),
};

export const INTENSITY_REST_CELLS: readonly CoverageCell[] = [
  TEMPO_PRESENT_CELL,
  ...INTENSITY_DIMS.map(intensityDimCell),
  ...EFFORT_FORMS.map(effortFormCell),
  ...PACE_VALUES.map(paceValueCell),
  ...HR_ZONES.map(hrZoneCell),
  ...NUMERIC_PACE_TYPES.map(numericPaceTypeCell),
  ...REST_SCOPES.map(restScopeCell),
  ...REST_UNITS.map(restUnitCell),
  ...REST_QUALIFIERS.map(restQualifierCell),
  REST_SET_INDEX_CELL,
];
