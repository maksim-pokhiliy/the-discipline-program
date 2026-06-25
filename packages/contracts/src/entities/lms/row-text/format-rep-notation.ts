import { type RepNotation } from "../_shared";

const RANGE_SEPARATOR = "–";
const SPACE = " ";
const MAX_LABEL = "max";

export const formatRepNotation = (reps: RepNotation): string => {
  switch (reps.kind) {
    case "count":
      return String(reps.value);
    case "range":
      return `${reps.min}${RANGE_SEPARATOR}${reps.max}`;
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
