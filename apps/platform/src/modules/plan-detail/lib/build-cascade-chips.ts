import { type Intensity, type TimeCap } from "@repo/contracts/lms/_shared";

const EFFORT_PREFIX = "@ ";
const EN_DASH = "–";
const PERCENT_SUFFIX = "%";
const RPE_PREFIX = "RPE ";
const HR_PREFIX = "HR ";
const PACE_PREFIX = "pace · ";
const NUMERIC_PACE_SEPARATOR = " / ";

export type BlockCtx = {
  intensity: Intensity | null;
  timeCap: TimeCap | null;
};

export type CascadeChipDescriptor = {
  text: string;
};

const formatEffortPercentText = (ep: NonNullable<Intensity["effortPercent"]>): string => {
  if ("value" in ep) {
    return `${EFFORT_PREFIX}${ep.value}${PERCENT_SUFFIX}`;
  }

  return `${EFFORT_PREFIX}${ep.range.min}${EN_DASH}${ep.range.max}${PERCENT_SUFFIX}`;
};

const formatRpeText = (rpe: NonNullable<Intensity["rpe"]>): string => `${RPE_PREFIX}${rpe.value}`;

const formatPaceText = (pace: NonNullable<Intensity["pace"]>): string => `${PACE_PREFIX}${pace}`;

const formatHrZoneText = (hrZone: NonNullable<Intensity["hrZone"]>): string =>
  `${HR_PREFIX}${hrZone.zone}`;

const formatNumericPaceText = (numericPace: NonNullable<Intensity["numericPace"]>): string =>
  `${numericPace.value}${NUMERIC_PACE_SEPARATOR}${numericPace.distanceUnit}`;

export const buildCascadeChips = (
  schemaIntensity: Intensity | null,
  blockIntensity: Intensity | null,
): CascadeChipDescriptor[] => {
  if (blockIntensity === null) {
    return [];
  }

  const out: CascadeChipDescriptor[] = [];

  if (blockIntensity.effortPercent !== undefined && schemaIntensity?.effortPercent === undefined) {
    out.push({ text: formatEffortPercentText(blockIntensity.effortPercent) });
  }

  if (blockIntensity.rpe !== undefined && schemaIntensity?.rpe === undefined) {
    out.push({ text: formatRpeText(blockIntensity.rpe) });
  }

  if (blockIntensity.pace !== undefined && schemaIntensity?.pace === undefined) {
    out.push({ text: formatPaceText(blockIntensity.pace) });
  }

  if (blockIntensity.hrZone !== undefined && schemaIntensity?.hrZone === undefined) {
    out.push({ text: formatHrZoneText(blockIntensity.hrZone) });
  }

  if (blockIntensity.numericPace !== undefined && schemaIntensity?.numericPace === undefined) {
    out.push({ text: formatNumericPaceText(blockIntensity.numericPace) });
  }

  return out;
};
