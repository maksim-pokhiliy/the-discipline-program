import { alpha, type Theme } from "@mui/material";

import { type Load, type ResultType } from "@repo/contracts/lms/_shared";
import {
  type BlockView,
  type ResolvedLoad,
  type RowView,
  type SchemaCardView,
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
import { isResultDraftValid, type ResultDraft } from "./result-form-config";

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

export type BenchmarkSchema = {
  schemaId: string;
  title: string;
  resultType: ResultType;
};

const firstMovement = (schema: SchemaCardView): string | null => {
  const firstItem = schema.items[0];

  if (firstItem === undefined) {
    return null;
  }

  if (firstItem.kind === "row") {
    return firstItem.row.movement;
  }

  return firstItem.members[0]?.movement ?? null;
};

const toBenchmark = (schema: SchemaCardView): BenchmarkSchema | null => {
  if (!schema.isBenchmark || schema.resultType === null) {
    return null;
  }

  return {
    schemaId: schema.schemaId,
    title: schema.header ?? firstMovement(schema) ?? schema.schemaId,
    resultType: schema.resultType,
  };
};

const collectSchemaCards = (block: BlockView): SchemaCardView[] =>
  block.items.flatMap((item) =>
    item.kind === "schema" ? [item.schema] : item.tracks.map((track) => track.schema),
  );

export const collectBenchmarkSchemas = (blocks: BlockView[]): BenchmarkSchema[] =>
  blocks
    .flatMap(collectSchemaCards)
    .map(toBenchmark)
    .filter((entry): entry is BenchmarkSchema => entry !== null);

export const areBenchmarksReady = (
  benchmarks: BenchmarkSchema[],
  drafts: Record<string, ResultDraft>,
): boolean =>
  benchmarks.every((benchmark) =>
    isResultDraftValid(benchmark.resultType, drafts[benchmark.schemaId] ?? {}),
  );
