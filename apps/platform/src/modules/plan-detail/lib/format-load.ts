import { type Load } from "@repo/contracts/lms/_shared";

import { type ExerciseById, formatPercentageReference } from "./format-percentage-reference";

const PERCENT_SUFFIX = "%";
const RANGE_SEPARATOR = "–";
const SPACE = " ";
const KG_SUFFIX = "kg";
const PAIR_PREFIX = "2x";
const BW_LABEL = "BW";
const PROFILE_COORD_SEPARATOR = "";
const PROFILE_KG_SEPARATOR = ":";
const PROFILE_LIST_SEPARATOR = " / ";
const PROFILE_GRID_SEPARATOR = " ";
const SINGLE_AXIS_COUNT = 1;

type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;

const formatProfileCell = (cell: ByProfileLoad["cells"][number]): string =>
  `${cell.coords.join(PROFILE_COORD_SEPARATOR)}${PROFILE_KG_SEPARATOR}${cell.kg}`;

const formatByProfile = (load: ByProfileLoad): string => {
  const separator =
    load.axes.length === SINGLE_AXIS_COUNT ? PROFILE_LIST_SEPARATOR : PROFILE_GRID_SEPARATOR;

  return load.cells.map(formatProfileCell).join(separator);
};

export const formatLoad = (load: Load, exerciseById: ExerciseById): string => {
  switch (load.kind) {
    case "absolute": {
      const prefix = load.count === 2 ? PAIR_PREFIX : "";

      return `@${prefix}${load.kg}${KG_SUFFIX}`;
    }
    case "percentage": {
      const head =
        load.rangeMax !== undefined
          ? `@${load.value}${RANGE_SEPARATOR}${load.rangeMax}${PERCENT_SUFFIX}`
          : `@${load.value}${PERCENT_SUFFIX}`;
      const ref = formatPercentageReference(load.reference, exerciseById);

      return ref.length > 0 ? `${head}${SPACE}${ref}` : head;
    }
    case "bodyweight":
      return BW_LABEL;
    case "byProfile":
      return formatByProfile(load);
    default:
      load satisfies never;

      return "";
  }
};
