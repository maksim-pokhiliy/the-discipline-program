import type { RestSpec } from "@repo/contracts/lms/_shared";

export type RestDurationInput =
  | { value: number; unit: "sec" }
  | { value: number; unit: "min" }
  | { value: number; rangeMax: number; unit: "range_sec" }
  | { value: number; rangeMax: number; unit: "range_min" };

export type RestQualifier = "until_recovery" | "fixed" | "range";

const buildRest = (
  scope: RestSpec["scope"],
  duration: RestDurationInput,
  qualifier?: RestQualifier,
  setIndex?: number,
): RestSpec => {
  const built: RestSpec = {
    scope,
    duration:
      duration.unit === "range_sec" || duration.unit === "range_min"
        ? { value: duration.value, rangeMax: duration.rangeMax, unit: duration.unit }
        : { value: duration.value, unit: duration.unit },
  };

  if (qualifier !== undefined) {
    built.qualifier = qualifier;
  }

  if (setIndex !== undefined) {
    built.setIndex = setIndex;
  }

  return built;
};

export const restBetweenSets = (duration: RestDurationInput, qualifier?: RestQualifier): RestSpec =>
  buildRest("between_sets", duration, qualifier);

export const restBetweenRounds = (
  duration: RestDurationInput,
  qualifier?: RestQualifier,
): RestSpec => buildRest("between_rounds", duration, qualifier);

export const restBetweenIntervals = (
  duration: RestDurationInput,
  qualifier?: RestQualifier,
): RestSpec => buildRest("between_intervals", duration, qualifier);

export const restAfterSpecificSet = (
  setIndex: number,
  duration: RestDurationInput,
  qualifier?: RestQualifier,
): RestSpec => {
  if (!Number.isInteger(setIndex) || setIndex <= 0) {
    throw new Error(`restAfterSpecificSet: setIndex must be a positive integer (got ${setIndex})`);
  }

  return buildRest("after_specific_set", duration, qualifier, setIndex);
};
