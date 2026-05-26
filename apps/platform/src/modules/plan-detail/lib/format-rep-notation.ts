import { type RepNotation } from "@repo/contracts/lms/_shared";

const REPS_SUFFIX = " reps";
const RANGE_SEPARATOR = "–";
const SPACE = " ";
const MAX_LABEL = "max";
const MAX_REMAINING_TIME_LABEL = "max (in remaining time)";
const MAX_PROGRESSIVE_PREFIX = "max · progressive";
const SEED_OPEN = " (";
const SEED_CLOSE = ")";
const IMPLICIT_LABEL = "implicit";
const TOTAL_PREFIX = "total ";
const COMPOUND_REP_UNIT_LABEL = "compound rep";

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
    case "max": {
      if (reps.subForm === "in_remaining_time") {
        return MAX_REMAINING_TIME_LABEL;
      }

      if (reps.subForm === "progressive") {
        const seedSuffix =
          reps.progressiveSeed !== undefined
            ? `${SEED_OPEN}${reps.progressiveSeed}${SEED_CLOSE}`
            : "";

        return `${MAX_PROGRESSIVE_PREFIX}${seedSuffix}`;
      }

      return MAX_LABEL;
    }
    case "implicit":
      return IMPLICIT_LABEL;
    case "total_flag":
      return `${TOTAL_PREFIX}${reps.value}`;
    case "compound_rep_unit":
      return COMPOUND_REP_UNIT_LABEL;
    default:
      reps satisfies never;

      return "";
  }
};
