import { type Intensity } from "../_shared";

export type IntensityLevel = "row" | "schema" | "block";

export type IntensityDimension = keyof Intensity;

export type IntensityProvenance = Partial<Record<IntensityDimension, IntensityLevel>>;

export type ResolvedIntensity = {
  effective: Intensity | null;
  provenance: IntensityProvenance;
};

const EMPTY_RESOLUTION: ResolvedIntensity = { effective: null, provenance: {} };

const DIMENSIONS: readonly IntensityDimension[] = [
  "effortPercent",
  "rpe",
  "pace",
  "hrZone",
  "numericPace",
];

const nearestLevel = (
  block: Intensity | null,
  schema: Intensity | null,
  row: Intensity | null,
  dimension: IntensityDimension,
): IntensityLevel | null => {
  if (row?.[dimension] !== undefined) {
    return "row";
  }

  if (schema?.[dimension] !== undefined) {
    return "schema";
  }

  if (block?.[dimension] !== undefined) {
    return "block";
  }

  return null;
};

const sourceFor = (
  level: IntensityLevel,
  block: Intensity | null,
  schema: Intensity | null,
  row: Intensity | null,
): Intensity | null => {
  if (level === "row") {
    return row;
  }

  if (level === "schema") {
    return schema;
  }

  return block;
};

const pickDimension = (
  block: Intensity | null,
  schema: Intensity | null,
  row: Intensity | null,
  dimension: IntensityDimension,
): { effective: Intensity; level: IntensityLevel } | null => {
  const level = nearestLevel(block, schema, row, dimension);

  if (level === null) {
    return null;
  }

  const source = sourceFor(level, block, schema, row);

  if (source === null) {
    return null;
  }

  switch (dimension) {
    case "effortPercent":
      return source.effortPercent === undefined
        ? null
        : { effective: { effortPercent: source.effortPercent }, level };
    case "rpe":
      return source.rpe === undefined ? null : { effective: { rpe: source.rpe }, level };
    case "pace":
      return source.pace === undefined ? null : { effective: { pace: source.pace }, level };
    case "hrZone":
      return source.hrZone === undefined ? null : { effective: { hrZone: source.hrZone }, level };
    case "numericPace":
      return source.numericPace === undefined
        ? null
        : { effective: { numericPace: source.numericPace }, level };
    default:
      dimension satisfies never;

      return null;
  }
};

export const resolveIntensity = (
  block: Intensity | null,
  schema: Intensity | null,
  row: Intensity | null,
): ResolvedIntensity => {
  if (block === null && schema === null && row === null) {
    return EMPTY_RESOLUTION;
  }

  let effective: Intensity = {};
  const provenance: IntensityProvenance = {};

  for (const dimension of DIMENSIONS) {
    const picked = pickDimension(block, schema, row, dimension);

    if (picked === null) {
      continue;
    }

    effective = { ...effective, ...picked.effective };
    provenance[dimension] = picked.level;
  }

  if (Object.keys(provenance).length === 0) {
    return EMPTY_RESOLUTION;
  }

  return { effective, provenance };
};
