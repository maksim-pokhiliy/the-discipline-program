import type { RestQualifier, RestScope, RestSpec } from "@repo/contracts/lms/_shared";

const REST_SCOPE_PHRASES: Record<RestScope, string> = {
  between_sets: "between sets",
  between_rounds: "between rounds",
  between_intervals: "between intervals",
  after_specific_set: "after set",
};

const REST_QUALIFIER_PHRASES: Record<RestQualifier, string> = {
  until_recovery: "until recovery",
  fixed: "fixed",
  range: "range",
};

const RANGE_UNIT_LABEL: Record<"range_sec" | "range_min", "sec" | "min"> = {
  range_sec: "sec",
  range_min: "min",
};

const formatDuration = (duration: RestSpec["duration"]): string => {
  if (duration.unit === "sec") {
    return `${duration.value} sec`;
  }

  if (duration.unit === "min") {
    return `${duration.value} min`;
  }

  const unit = RANGE_UNIT_LABEL[duration.unit];

  return duration.rangeMax !== undefined
    ? `${duration.value}-${duration.rangeMax} ${unit}`
    : `${duration.value} ${unit}`;
};

export const formatRestRaw = (parsed: RestSpec): string => {
  const durationStr = formatDuration(parsed.duration);

  const scopeStr =
    parsed.setIndex !== undefined
      ? `${REST_SCOPE_PHRASES[parsed.scope]} ${parsed.setIndex}`
      : REST_SCOPE_PHRASES[parsed.scope];

  const qualifierStr =
    parsed.qualifier !== undefined ? `(${REST_QUALIFIER_PHRASES[parsed.qualifier]})` : "";

  return ["rest", durationStr, scopeStr, qualifierStr].filter((s) => s.length > 0).join(" ");
};
