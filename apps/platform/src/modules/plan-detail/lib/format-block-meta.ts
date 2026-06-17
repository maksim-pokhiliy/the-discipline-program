import { type Intensity } from "@repo/contracts/lms/_shared";
import { type IndicatorChipTone } from "@repo/ui";

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

const TONE_PRIMARY: IndicatorChipTone = "primary";
const TONE_INFO: IndicatorChipTone = "info";
const TONE_DEFAULT: IndicatorChipTone = "default";

export type IntensityChipDescriptor = {
  tone: IndicatorChipTone;
  text: string;
};

export type EmphasizedIntensityChip = IntensityChipDescriptor & {
  dimension: IntensityDimension;
  inherited: boolean;
};

type DimensionChip = IntensityChipDescriptor & {
  dimension: IntensityDimension;
};

const formatEffortPercent = (
  ep: NonNullable<Intensity["effortPercent"]>,
): IntensityChipDescriptor => {
  if ("value" in ep) {
    return { tone: TONE_PRIMARY, text: `${EFFORT_PREFIX}${ep.value}${PERCENT_SUFFIX}` };
  }

  return {
    tone: TONE_PRIMARY,
    text: `${EFFORT_PREFIX}${ep.range.min}${EN_DASH}${ep.range.max}${PERCENT_SUFFIX}`,
  };
};

const buildDimensionChips = (intensity: Intensity | null): DimensionChip[] => {
  if (intensity === null) {
    return [];
  }

  const out: DimensionChip[] = [];

  if (intensity.effortPercent !== undefined) {
    out.push({ dimension: "effortPercent", ...formatEffortPercent(intensity.effortPercent) });
  }

  if (intensity.rpe !== undefined) {
    out.push({ dimension: "rpe", tone: TONE_INFO, text: `${RPE_PREFIX}${intensity.rpe.value}` });
  }

  if (intensity.pace !== undefined) {
    out.push({
      dimension: "pace",
      tone: TONE_DEFAULT,
      text: `${PACE_PREFIX}${intensity.pace}`.toUpperCase(),
    });
  }

  if (intensity.hrZone !== undefined) {
    out.push({
      dimension: "hrZone",
      tone: TONE_INFO,
      text: `${HR_PREFIX}${intensity.hrZone.zone}`,
    });
  }

  if (intensity.numericPace !== undefined) {
    out.push({
      dimension: "numericPace",
      tone: TONE_DEFAULT,
      text: `${intensity.numericPace.value}${NUMERIC_PACE_SEPARATOR}${intensity.numericPace.distanceUnit}`,
    });
  }

  return out;
};

export const formatIntensityChips = (intensity: Intensity | null): IntensityChipDescriptor[] =>
  buildDimensionChips(intensity).map(({ tone, text }) => ({ tone, text }));

export const formatEffectiveIntensityChips = (
  resolved: ResolvedIntensity,
  level: IntensityLevel,
): EmphasizedIntensityChip[] =>
  buildDimensionChips(resolved.effective).map((chip) => ({
    ...chip,
    inherited: resolved.provenance[chip.dimension] !== level,
  }));
