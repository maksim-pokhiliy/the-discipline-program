import { type EffortPercent, type Intensity } from "@repo/contracts/lms/_shared";

const RANGE_SEPARATOR = "–";
const PERCENT = "%";
const RPE_PREFIX = "RPE ";
const EFFORT_SUFFIX = "% effort";
const PACE_SUFFIX = " pace";
const NUMERIC_PACE_SEPARATOR = " / ";

const effortValue = (effort: EffortPercent): string =>
  "value" in effort
    ? `${effort.value}`
    : `${effort.range.min}${RANGE_SEPARATOR}${effort.range.max}`;

const capitalize = (value: string): string =>
  value.length === 0 ? value : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const formatIntensity = (intensity: Intensity | null): string => {
  if (intensity === null) {
    return "";
  }

  if (intensity.rpe !== undefined) {
    return `${RPE_PREFIX}${intensity.rpe.value}`;
  }

  if (intensity.effortPercent !== undefined) {
    return `${effortValue(intensity.effortPercent)}${EFFORT_SUFFIX}`;
  }

  if (intensity.pace !== undefined) {
    return `${intensity.pace}${PACE_SUFFIX}`;
  }

  if (intensity.hrZone !== undefined) {
    return intensity.hrZone.zone;
  }

  if (intensity.numericPace !== undefined) {
    return `${intensity.numericPace.value}${NUMERIC_PACE_SEPARATOR}${intensity.numericPace.distanceUnit}`;
  }

  return "";
};

export const formatBlockIntensity = (intensity: Intensity | null): string => {
  if (intensity === null) {
    return "";
  }

  if (intensity.rpe !== undefined) {
    return `${RPE_PREFIX}${intensity.rpe.value}`;
  }

  if (intensity.pace !== undefined) {
    return capitalize(intensity.pace);
  }

  if (intensity.effortPercent !== undefined) {
    return `${effortValue(intensity.effortPercent)}${PERCENT}`;
  }

  if (intensity.hrZone !== undefined) {
    return intensity.hrZone.zone;
  }

  if (intensity.numericPace !== undefined) {
    return `${intensity.numericPace.value}${NUMERIC_PACE_SEPARATOR}${intensity.numericPace.distanceUnit}`;
  }

  return "";
};
