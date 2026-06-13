import { type Intensity } from "@repo/contracts/lms/_shared";
import { type IndicatorChipTone } from "@repo/ui";

const EFFORT_PREFIX = "@ ";
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

export const formatIntensityChips = (intensity: Intensity | null): IntensityChipDescriptor[] => {
  if (intensity === null) {
    return [];
  }

  const out: IntensityChipDescriptor[] = [];

  if (intensity.effortPercent !== undefined) {
    out.push(formatEffortPercent(intensity.effortPercent));
  }

  if (intensity.rpe !== undefined) {
    out.push({ tone: TONE_INFO, text: `${RPE_PREFIX}${intensity.rpe.value}` });
  }

  if (intensity.pace !== undefined) {
    out.push({ tone: TONE_DEFAULT, text: `${PACE_PREFIX}${intensity.pace}` });
  }

  if (intensity.hrZone !== undefined) {
    out.push({ tone: TONE_INFO, text: `${HR_PREFIX}${intensity.hrZone.zone}` });
  }

  if (intensity.numericPace !== undefined) {
    out.push({
      tone: TONE_DEFAULT,
      text: `${intensity.numericPace.value}${NUMERIC_PACE_SEPARATOR}${intensity.numericPace.distanceUnit}`,
    });
  }

  return out;
};
