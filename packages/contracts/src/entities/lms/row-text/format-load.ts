import { type Load } from "../_shared";

import { type ExerciseById, formatPercentageReference } from "./format-percentage-reference";

const PERCENT_SUFFIX = "%";
const RANGE_SEPARATOR = "–";
const SPACE = " ";
const KG_SUFFIX = "kg";
const PAIR_PREFIX = "2x";
const BW_LABEL = "BW";
const PROFILE_KG_SEPARATOR = ":";
const PROFILE_GROUP_SEPARATOR = " / ";
const PROFILE_INNER_SEPARATOR = " ";
const SINGLE_AXIS_COUNT = 1;

type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;
type ByProfileCell = ByProfileLoad["cells"][number];

const formatSingleAxis = (cells: readonly ByProfileCell[]): string =>
  cells
    .map((cell) => `${cell.coords[0] ?? ""}${PROFILE_KG_SEPARATOR}${cell.kg}`)
    .join(PROFILE_GROUP_SEPARATOR);

const formatTwoAxis = (cells: readonly ByProfileCell[]): string => {
  const groups = new Map<string, string[]>();

  for (const cell of cells) {
    const [outer = "", inner = ""] = cell.coords;
    const entry = `${inner}${PROFILE_KG_SEPARATOR}${cell.kg}`;

    groups.set(outer, [...(groups.get(outer) ?? []), entry]);
  }

  return [...groups.entries()]
    .map(([outer, entries]) => `${outer} ${entries.join(PROFILE_INNER_SEPARATOR)}`)
    .join(PROFILE_GROUP_SEPARATOR);
};

const formatByProfile = (load: ByProfileLoad): string =>
  load.axes.length === SINGLE_AXIS_COUNT ? formatSingleAxis(load.cells) : formatTwoAxis(load.cells);

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
