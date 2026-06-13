import { type Load } from "@repo/contracts/lms/_shared";

import { type ExerciseById, formatPercentageReference } from "./format-percentage-reference";

const PERCENT_SUFFIX = "%";
const RANGE_SEPARATOR = "–";
const SPACE = " ";
const KG_SUFFIX = " kg";
const PAIR_PREFIX = "2× ";
const BW_LABEL = "BW";
const BY_PROFILE_SEPARATOR = " / ";

const formatProfileEntry = (entry: { label: string; kg: number }): string =>
  `${entry.label}: ${entry.kg}`;

export const formatLoad = (load: Load, exerciseById: ExerciseById): string => {
  switch (load.kind) {
    case "absolute": {
      const body = `${load.kg}${KG_SUFFIX}`;

      return load.count === 2 ? `${PAIR_PREFIX}${body}` : body;
    }
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
    case "byProfile":
      return load.entries.map(formatProfileEntry).join(BY_PROFILE_SEPARATOR);
    default:
      load satisfies never;

      return "";
  }
};
