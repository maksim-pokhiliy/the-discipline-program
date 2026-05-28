import { RowKind } from "@prisma/client";

import { countSchemaRow } from "./shared";
import { type CoverageCell } from "./types";

const TEMPO_AXES: readonly string[] = [
  "fullTempo",
  "slowEccentric",
  "pauseInUp",
  "holdAfterLast",
  "perNthRepPause",
];

const tempoAxisCell = (axis: string): CoverageCell => ({
  id: `tempoModifier.${axis}`,
  category: "tempoModifier.axis",
  label: `TempoModifier.${axis} set`,
  required: 1,
  sourceRef: `coverage-matrix §9 ${axis}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, { tempo: { path: [axis], not: { equals: null } } }),
});

const SEQUENCE_KINDS: readonly string[] = [
  "before_named",
  "after_named",
  "before_named_after_named_composite",
  "only_once_before",
  "after_each_round",
  "after_each_typed_round",
];

const sequenceKindCell = (kind: string): CoverageCell => ({
  id: `sequenceIndicator.${kind}`,
  category: "sequenceIndicator.kind",
  label: `SequenceIndicator.kind = ${kind}`,
  required: 1,
  sourceRef: `coverage-matrix §10 ${kind}`,
  tally: (db, planId) => countSchemaRow(db, planId, { sequence: { path: ["kind"], equals: kind } }),
});

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
  label: `Intensity.${dim} set on row/schema/block`,
  required,
  sourceRef: `coverage-matrix §11 ${dim}`,
  tally: async (db, planId) => {
    const [rowCount, schemaCount, blockCount] = await Promise.all([
      countSchemaRow(db, planId, { intensity: { path: [dim], not: { equals: null } } }),
      db.schema.count({
        where: {
          intensity: { path: [dim], not: { equals: null } },
          block: { session: { day: { week: { planId } } } },
        },
      }),
      db.block.count({
        where: {
          intensity: { path: [dim], not: { equals: null } },
          session: { day: { week: { planId } } },
        },
      }),
    ]);

    return rowCount + schemaCount + blockCount;
  },
});

const EFFORT_FORMS: readonly { form: "value" | "range"; key: "value" | "range" }[] = [
  { form: "value", key: "value" },
  { form: "range", key: "range" },
];

const effortFormCell = ({ form }: { form: "value" | "range" }): CoverageCell => ({
  id: `intensity.effortPercent.${form}`,
  category: "intensity.dim",
  label: `Intensity.effortPercent ${form}-form`,
  required: 1,
  sourceRef: `coverage-matrix §11 effortPercent ${form}`,
  tally: async (db, planId) => {
    const [rowCount, schemaCount, blockCount] = await Promise.all([
      countSchemaRow(db, planId, {
        intensity: { path: ["effortPercent", form], not: { equals: null } },
      }),
      db.schema.count({
        where: {
          intensity: { path: ["effortPercent", form], not: { equals: null } },
          block: { session: { day: { week: { planId } } } },
        },
      }),
      db.block.count({
        where: {
          intensity: { path: ["effortPercent", form], not: { equals: null } },
          session: { day: { week: { planId } } },
        },
      }),
    ]);

    return rowCount + schemaCount + blockCount;
  },
});

const PACE_VALUES: readonly string[] = ["easy", "moderate", "hard", "recovery"];

const paceValueCell = (pace: string): CoverageCell => ({
  id: `intensity.pace.${pace}`,
  category: "intensity.dim",
  label: `Intensity.pace = ${pace}`,
  required: 1,
  sourceRef: `coverage-matrix §11 pace ${pace}`,
  tally: async (db, planId) => {
    const [rowCount, schemaCount, blockCount] = await Promise.all([
      countSchemaRow(db, planId, { intensity: { path: ["pace"], equals: pace } }),
      db.schema.count({
        where: {
          intensity: { path: ["pace"], equals: pace },
          block: { session: { day: { week: { planId } } } },
        },
      }),
      db.block.count({
        where: {
          intensity: { path: ["pace"], equals: pace },
          session: { day: { week: { planId } } },
        },
      }),
    ]);

    return rowCount + schemaCount + blockCount;
  },
});

const HR_ZONES: readonly string[] = ["Z1", "Z2", "Z3", "Z4", "Z5"];

const hrZoneCell = (zone: string): CoverageCell => ({
  id: `intensity.hrZone.${zone}`,
  category: "intensity.dim",
  label: `Intensity.hrZone.zone = ${zone}`,
  required: 1,
  sourceRef: `coverage-matrix §11 hrZone ${zone}`,
  tally: async (db, planId) => {
    const [rowCount, schemaCount, blockCount] = await Promise.all([
      countSchemaRow(db, planId, { intensity: { path: ["hrZone", "zone"], equals: zone } }),
      db.schema.count({
        where: {
          intensity: { path: ["hrZone", "zone"], equals: zone },
          block: { session: { day: { week: { planId } } } },
        },
      }),
      db.block.count({
        where: {
          intensity: { path: ["hrZone", "zone"], equals: zone },
          session: { day: { week: { planId } } },
        },
      }),
    ]);

    return rowCount + schemaCount + blockCount;
  },
});

const NUMERIC_PACE_TYPES: readonly string[] = ["min_per_distance", "distance_per_min"];

const numericPaceTypeCell = (paceType: string): CoverageCell => ({
  id: `intensity.numericPace.${paceType}`,
  category: "intensity.dim",
  label: `Intensity.numericPace.paceType = ${paceType}`,
  required: 1,
  sourceRef: `coverage-matrix §11 numericPace ${paceType}`,
  tally: async (db, planId) => {
    const [rowCount, schemaCount, blockCount] = await Promise.all([
      countSchemaRow(db, planId, {
        intensity: { path: ["numericPace", "paceType"], equals: paceType },
      }),
      db.schema.count({
        where: {
          intensity: { path: ["numericPace", "paceType"], equals: paceType },
          block: { session: { day: { week: { planId } } } },
        },
      }),
      db.block.count({
        where: {
          intensity: { path: ["numericPace", "paceType"], equals: paceType },
          session: { day: { week: { planId } } },
        },
      }),
    ]);

    return rowCount + schemaCount + blockCount;
  },
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
  label: `RestSpec.scope = ${scope}`,
  required: 1,
  sourceRef: `coverage-matrix §12 scope ${scope}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.REST,
      rowPayload: { path: ["parsed", "scope"], equals: scope },
    }),
});

const REST_UNITS: readonly string[] = ["sec", "min", "range_sec", "range_min"];

const restUnitCell = (unit: string): CoverageCell => ({
  id: `restSpec.unit.${unit}`,
  category: "restSpec.unit",
  label: `RestSpec.duration.unit = ${unit}`,
  required: 1,
  sourceRef: `coverage-matrix §12 unit ${unit}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.REST,
      rowPayload: { path: ["parsed", "duration", "unit"], equals: unit },
    }),
});

const REST_QUALIFIERS: readonly string[] = ["until_recovery", "fixed", "range"];

const restQualifierCell = (qualifier: string): CoverageCell => ({
  id: `restSpec.qualifier.${qualifier}`,
  category: "restSpec.qualifier",
  label: `RestSpec.qualifier = ${qualifier}`,
  required: 1,
  sourceRef: `coverage-matrix §12 qualifier ${qualifier}`,
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.REST,
      rowPayload: { path: ["parsed", "qualifier"], equals: qualifier },
    }),
});

const REST_SET_INDEX_CELL: CoverageCell = {
  id: "restSpec.setIndex",
  category: "restSpec.scope",
  label: "RestSpec.setIndex set (after_specific_set scope)",
  required: 1,
  sourceRef: "coverage-matrix §12 setIndex",
  tally: (db, planId) =>
    countSchemaRow(db, planId, {
      rowKind: RowKind.REST,
      rowPayload: { path: ["parsed", "setIndex"], not: { equals: null } },
    }),
};

export const INTENSITY_REST_CELLS: readonly CoverageCell[] = [
  ...TEMPO_AXES.map(tempoAxisCell),
  ...SEQUENCE_KINDS.map(sequenceKindCell),
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
