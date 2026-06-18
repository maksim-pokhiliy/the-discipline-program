import { alpha, type Theme } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";
import {
  type ResolvedLoad,
  type RowView,
  type SessionHeaderView,
} from "@repo/contracts/lms/session-detail";

import {
  KG_LABEL,
  LOGGED_PREFIX,
  MONTH_LONG,
  ONE_RM_HINT_SUFFIX,
  PER_HAND_SUFFIX,
  PROFILE_AXIS_SEPARATOR,
  SCHEMA_BENCHMARK_BORDER_ALPHA,
  SUB_LINE_SEPARATOR,
  WEEKDAY_LONG,
} from "./athlete-session.constants";
import { formatIntensity } from "./format-intensity";
import { formatSide } from "./format-side";
import { formatTempoInput } from "./format-tempo-input";

const PERCENT = "%";
const RANGE_SEPARATOR = "–";
const MODIFIER_SEPARATOR = ", ";

export type CardDecoration = {
  borderColor: string;
};

export const resolveCardDecoration = (isBenchmark: boolean, theme: Theme): CardDecoration => ({
  borderColor: isBenchmark
    ? alpha(theme.palette.success.main, SCHEMA_BENCHMARK_BORDER_ALPHA)
    : theme.palette.divider,
});

export type ResolvedLoadCell = { state: "resolved"; value: string; sub: string | null };
export type BodyweightLoadCell = { state: "bodyweight" };
export type OneRmLoadCell = { state: "missing_one_rm"; exerciseId: string; hint: string };
export type ProfilePickLoadCell = { state: "missing_profile_pick"; hint: string };
export type EmptyLoadCell = { state: "empty" };

export type LoadCellModel =
  | ResolvedLoadCell
  | BodyweightLoadCell
  | OneRmLoadCell
  | ProfilePickLoadCell
  | EmptyLoadCell;

const percentageSub = (load: Load | null): string | null => {
  if (load === null || load.kind !== "percentage") {
    return null;
  }

  return load.rangeMax !== undefined
    ? `${load.value}${RANGE_SEPARATOR}${load.rangeMax}${PERCENT}`
    : `${load.value}${PERCENT}`;
};

const resolvedSub = (load: Load | null, perHand: boolean, kg: number): string | null =>
  perHand ? `${kg} ${PER_HAND_SUFFIX}` : percentageSub(load);

const oneRmHint = (load: Load | null): string =>
  load !== null && load.kind === "percentage"
    ? `${load.value}${ONE_RM_HINT_SUFFIX}`
    : ONE_RM_HINT_SUFFIX.trim();

const profilePickHint = (load: Load | null, axisNames: string[]): string =>
  load !== null && load.kind === "byProfile"
    ? load.axes.map((axis) => axis.values.join("/")).join(PROFILE_AXIS_SEPARATOR)
    : axisNames.join(PROFILE_AXIS_SEPARATOR);

export const resolveLoadCell = (
  resolvedLoad: ResolvedLoad | null,
  load: Load | null,
): LoadCellModel => {
  if (resolvedLoad === null) {
    return { state: "empty" };
  }

  switch (resolvedLoad.status) {
    case "resolved":
      return {
        state: "resolved",
        value: `${resolvedLoad.kg} ${KG_LABEL}`,
        sub: resolvedSub(load, resolvedLoad.perHand, resolvedLoad.kg),
      };
    case "not_applicable":
      return { state: "bodyweight" };
    case "unresolved":
      return resolvedLoad.reason === "missing_one_rm"
        ? { state: "missing_one_rm", exerciseId: resolvedLoad.exerciseId, hint: oneRmHint(load) }
        : { state: "missing_profile_pick", hint: profilePickHint(load, resolvedLoad.axisNames) };
    default:
      resolvedLoad satisfies never;

      return { state: "empty" };
  }
};

export const buildRowSubLine = (row: RowView): string =>
  [
    formatTempoInput(row.tempo),
    row.side !== null ? formatSide(row.side) : "",
    formatIntensity(row.intensity),
    row.modifiers.join(MODIFIER_SEPARATOR),
  ]
    .filter((part) => part.length > 0)
    .join(SUB_LINE_SEPARATOR);

export const formatSessionDate = ({ dayOfWeek, dayOfMonth }: SessionHeaderView): string =>
  `${WEEKDAY_LONG[dayOfWeek]} ${dayOfMonth}`;

export const formatCompletedDate = (completedAt: Date): string =>
  `${LOGGED_PREFIX} ${MONTH_LONG[completedAt.getUTCMonth()]} ${completedAt.getUTCDate()}`;
