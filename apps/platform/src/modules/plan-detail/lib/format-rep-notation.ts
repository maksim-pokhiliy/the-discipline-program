import { type RepNotation } from "@repo/contracts/lms/_shared";

const REPS_SUFFIX = " reps";
const RANGE_SEPARATOR = "–";
const SPACE = " ";
const MAX_LABEL = "max";

export const formatRepNotation = (reps: RepNotation): string => {
  switch (reps.kind) {
    case "count":
      return `${reps.value}${REPS_SUFFIX}`;
    case "range":
      return `${reps.min}${RANGE_SEPARATOR}${reps.max}${REPS_SUFFIX}`;
    case "unit_bound": {
      if (reps.value !== undefined) {
        return `${reps.value}${SPACE}${reps.unit}`;
      }

      if (reps.range !== undefined) {
        return `${reps.range.min}${RANGE_SEPARATOR}${reps.range.max}${SPACE}${reps.unit}`;
      }

      return reps.unit;
    }
    case "max":
      return reps.tail !== undefined ? `${MAX_LABEL}${SPACE}${reps.tail}` : MAX_LABEL;
    default:
      reps satisfies never;

      return "";
  }
};
