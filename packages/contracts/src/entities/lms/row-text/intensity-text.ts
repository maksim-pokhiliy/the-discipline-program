import { type Intensity } from "../_shared";

import {
  type IntensityDimension,
  type IntensityLevel,
  type ResolvedIntensity,
} from "./resolve-intensity";

const EFFORT_PREFIX = "EFFORT ";
const EN_DASH = "–";
const PERCENT_SUFFIX = "%";
const RPE_PREFIX = "RPE ";
const HR_PREFIX = "HR ";
const PACE_PREFIX = "pace · ";
const NUMERIC_PACE_SEPARATOR = " / ";

export type IntensityText = {
  dimension: IntensityDimension;
  text: string;
};

export type EmphasizedIntensityText = IntensityText & {
  inherited: boolean;
};

const formatEffortPercent = (ep: NonNullable<Intensity["effortPercent"]>): string => {
  if ("value" in ep) {
    return `${EFFORT_PREFIX}${ep.value}${PERCENT_SUFFIX}`;
  }

  return `${EFFORT_PREFIX}${ep.range.min}${EN_DASH}${ep.range.max}${PERCENT_SUFFIX}`;
};

export const buildIntensityTexts = (intensity: Intensity | null): IntensityText[] => {
  if (intensity === null) {
    return [];
  }

  const out: IntensityText[] = [];

  if (intensity.effortPercent !== undefined) {
    out.push({ dimension: "effortPercent", text: formatEffortPercent(intensity.effortPercent) });
  }

  if (intensity.rpe !== undefined) {
    out.push({ dimension: "rpe", text: `${RPE_PREFIX}${intensity.rpe.value}` });
  }

  if (intensity.pace !== undefined) {
    out.push({ dimension: "pace", text: `${PACE_PREFIX}${intensity.pace}`.toUpperCase() });
  }

  if (intensity.hrZone !== undefined) {
    out.push({ dimension: "hrZone", text: `${HR_PREFIX}${intensity.hrZone.zone}` });
  }

  if (intensity.numericPace !== undefined) {
    out.push({
      dimension: "numericPace",
      text: `${intensity.numericPace.value}${NUMERIC_PACE_SEPARATOR}${intensity.numericPace.distanceUnit}`,
    });
  }

  return out;
};

export const buildEffectiveIntensityTexts = (
  resolved: ResolvedIntensity,
  level: IntensityLevel,
): EmphasizedIntensityText[] =>
  buildIntensityTexts(resolved.effective).map((chip) => ({
    ...chip,
    inherited: resolved.provenance[chip.dimension] !== level,
  }));
