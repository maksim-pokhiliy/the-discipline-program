import { type Load } from "@repo/contracts/lms/_shared";
import { type ResolvedLoad, type RowView } from "@repo/contracts/lms/session-detail";

import {
  ABSOLUTE_PAIR_PREFIX,
  BODYWEIGHT_LABEL,
  KG_LABEL,
  PICK_YOUR_PREFIX,
  PROFILE_AXIS_SEPARATOR,
  PROFILE_GROUP_SEPARATOR,
} from "./athlete-session.constants";
import {
  CHIP_COORD_SEPARATOR,
  ONE_RM_OF_PREFIX,
  PERCENT_SUFFIX,
  PICK_YOUR_LEVEL_LABEL,
  PROFILE_CELL_SEPARATOR,
  RANGE_SEPARATOR,
  SET_YOUR_MAX_LABEL,
} from "./weight-sheet.constants";

const SINGLE_AXIS_COUNT = 1;
const PAIR_COUNT = 2;

export type LoadChipTarget = { kind: "level" } | { kind: "one_rm"; exerciseId: string };

export type LoadCellView =
  | { kind: "empty" }
  | { kind: "bare"; value: string }
  | { kind: "chip"; value: string; source: string; isPrompt: boolean; target: LoadChipTarget };

type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;
type ByProfileCell = ByProfileLoad["cells"][number];
type ResolvedArm = Extract<ResolvedLoad, { status: "resolved" }>;
type UnresolvedArm = Extract<ResolvedLoad, { status: "unresolved" }>;

const absoluteValue = (count: 1 | 2, kg: number): string =>
  `${count === PAIR_COUNT ? ABSOLUTE_PAIR_PREFIX : ""}${kg} ${KG_LABEL}`;

const bareValue = (load: Load | null, kg: number): string =>
  load !== null && load.kind === "absolute"
    ? absoluteValue(load.count, load.kg)
    : `${kg} ${KG_LABEL}`;

const percentSpan = (value: number, max: number | undefined): string =>
  max === undefined ? `${value}` : `${value}${RANGE_SEPARATOR}${max}`;

const percentValue = (load: Load | null): string =>
  load !== null && load.kind === "percentage"
    ? `${percentSpan(load.value, load.rangeMax)}${PERCENT_SUFFIX}`
    : PERCENT_SUFFIX;

const spreadOfValues = (cells: readonly ByProfileCell[]): string => {
  const entries = cells
    .map((cell) => `${cell.coords[0] ?? ""}${PROFILE_CELL_SEPARATOR}${cell.kg}`)
    .join(PROFILE_GROUP_SEPARATOR);

  return `${entries} ${KG_LABEL}`;
};

const spreadOfRange = (cells: readonly ByProfileCell[]): string => {
  const kgs = cells.map((cell) => cell.kg);

  return `${Math.min(...kgs)}${RANGE_SEPARATOR}${Math.max(...kgs)} ${KG_LABEL}`;
};

const spreadValue = (load: Load | null, axisLabels: string[]): string => {
  if (load === null || load.kind !== "byProfile" || load.cells.length === 0) {
    return axisLabels.join(PROFILE_AXIS_SEPARATOR);
  }

  return load.axes.length === SINGLE_AXIS_COUNT
    ? spreadOfValues(load.cells)
    : spreadOfRange(load.cells);
};

const pickPrompt = (load: Load | null, axisLabels: string[]): string => {
  const labels =
    load !== null && load.kind === "byProfile" ? load.axes.map((axis) => axis.label) : axisLabels;
  const [onlyLabel] = labels;

  return labels.length === SINGLE_AXIS_COUNT && onlyLabel !== undefined
    ? `${PICK_YOUR_PREFIX}${onlyLabel.toLowerCase()}`
    : PICK_YOUR_LEVEL_LABEL;
};

const buildResolvedCell = (resolvedLoad: ResolvedArm, load: Load | null): LoadCellView => {
  const source = resolvedLoad.source;

  if (source === undefined) {
    return { kind: "bare", value: bareValue(load, resolvedLoad.kg) };
  }

  const value = `${resolvedLoad.kg} ${KG_LABEL}`;

  switch (source.kind) {
    case "profile":
      return {
        kind: "chip",
        value,
        source: source.coords.map((coord) => coord.value).join(CHIP_COORD_SEPARATOR),
        isPrompt: false,
        target: { kind: "level" },
      };
    case "one_rm":
      return {
        kind: "chip",
        value,
        source: `${percentSpan(source.percent, source.percentMax)}${ONE_RM_OF_PREFIX}${source.baseKg}`,
        isPrompt: false,
        target: { kind: "one_rm", exerciseId: source.exerciseId },
      };
    default:
      source satisfies never;

      return { kind: "bare", value };
  }
};

const buildUnresolvedCell = (resolvedLoad: UnresolvedArm, load: Load | null): LoadCellView => {
  switch (resolvedLoad.reason) {
    case "missing_one_rm":
      return {
        kind: "chip",
        value: percentValue(load),
        source: SET_YOUR_MAX_LABEL,
        isPrompt: true,
        target: { kind: "one_rm", exerciseId: resolvedLoad.exerciseId },
      };
    case "missing_profile_pick":
    case "missing_profile_attribute":
      return {
        kind: "chip",
        value: spreadValue(load, resolvedLoad.axisLabels),
        source: pickPrompt(load, resolvedLoad.axisLabels),
        isPrompt: true,
        target: { kind: "level" },
      };
    default:
      resolvedLoad satisfies never;

      return { kind: "empty" };
  }
};

export const hasLoadValue = (cell: LoadCellView): boolean =>
  cell.kind !== "empty" && cell.value.length > 0;

export const buildLoadCell = (row: RowView): LoadCellView => {
  const resolvedLoad = row.resolvedLoad;

  if (resolvedLoad === null) {
    return { kind: "empty" };
  }

  switch (resolvedLoad.status) {
    case "resolved":
      return buildResolvedCell(resolvedLoad, row.load);
    case "bodyweight":
      return { kind: "bare", value: BODYWEIGHT_LABEL };
    case "not_applicable":
      return { kind: "empty" };
    case "unresolved":
      return buildUnresolvedCell(resolvedLoad, row.load);
    default:
      resolvedLoad satisfies never;

      return { kind: "empty" };
  }
};
