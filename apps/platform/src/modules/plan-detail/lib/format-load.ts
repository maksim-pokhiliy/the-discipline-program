import { type Load } from "@repo/contracts/lms/_shared";

import { type ExerciseById, formatPercentageReference } from "./format-percentage-reference";
import { formatWeight } from "./format-weight";

const PERCENT_SUFFIX = "%";
const RANGE_SEPARATOR = "–";
const SPACE = " ";
const BW_LABEL = "BW";
const WITHOUT_WEIGHT_LABEL = "without weight";
const UNSPECIFIED_LABEL = "—";

export const formatLoad = (load: Load, exerciseById: ExerciseById): string => {
  switch (load.kind) {
    case "absolute":
      return formatWeight(load.weight);
    case "percentage": {
      const head =
        load.rangeMax !== undefined
          ? `${load.value}${RANGE_SEPARATOR}${load.rangeMax}${PERCENT_SUFFIX}`
          : `${load.value}${PERCENT_SUFFIX}`;
      const ref = formatPercentageReference(load.reference, exerciseById);

      return ref.length > 0 ? `${head}${SPACE}${ref}` : head;
    }
    case "bodyweight":
      return BW_LABEL;
    case "without_weight":
      return WITHOUT_WEIGHT_LABEL;
    case "unspecified":
      return UNSPECIFIED_LABEL;
    default:
      load satisfies never;

      return "";
  }
};
