import { type RestSpec } from "@repo/contracts/lms/_shared";

const REST_PREFIX = "rest ";
const RANGE_SEPARATOR = "–";
const SEC_SUFFIX = "s";
const MIN_SUFFIX = " min";
const SPACE = " ";
const UNTIL_RECOVERY_SUFFIX = " · until recovery";

const BETWEEN_SETS_SCOPE = "between sets";
const BETWEEN_ROUNDS_SCOPE = "between rounds";
const BETWEEN_INTERVALS_SCOPE = "between intervals";
const AFTER_SET_PREFIX = "after set ";
const UNKNOWN_SET_INDEX_FALLBACK = "?";

const UNTIL_RECOVERY_QUALIFIER = "until_recovery";

const formatDuration = (duration: RestSpec["duration"]): string => {
  const { unit, value, rangeMax } = duration;

  if (unit === "sec") {
    return `${value}${SEC_SUFFIX}`;
  }

  if (unit === "min") {
    return `${value}${MIN_SUFFIX}`;
  }

  const rangeUpper = rangeMax ?? value;

  if (unit === "range_sec") {
    return `${value}${RANGE_SEPARATOR}${rangeUpper}${SPACE}${SEC_SUFFIX}`;
  }

  return `${value}${RANGE_SEPARATOR}${rangeUpper}${MIN_SUFFIX}`;
};

const formatScopeSuffix = (rest: RestSpec): string => {
  switch (rest.scope) {
    case "between_sets":
      return ` ${BETWEEN_SETS_SCOPE}`;
    case "between_rounds":
      return ` ${BETWEEN_ROUNDS_SCOPE}`;
    case "between_intervals":
      return ` ${BETWEEN_INTERVALS_SCOPE}`;
    case "after_specific_set":
      return ` ${AFTER_SET_PREFIX}${rest.setIndex ?? UNKNOWN_SET_INDEX_FALLBACK}`;
    default: {
      rest.scope satisfies never;

      return "";
    }
  }
};

export const formatRestSpec = (rest: RestSpec): string => {
  const duration = formatDuration(rest.duration);
  const scopeSuffix = formatScopeSuffix(rest);
  const qualifierSuffix = rest.qualifier === UNTIL_RECOVERY_QUALIFIER ? UNTIL_RECOVERY_SUFFIX : "";

  return `${REST_PREFIX}${duration}${scopeSuffix}${qualifierSuffix}`;
};
