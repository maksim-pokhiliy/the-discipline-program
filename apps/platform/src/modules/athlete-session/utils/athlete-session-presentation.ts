import { alpha, type Theme } from "@mui/material";

import {
  type Load,
  type RepNotation,
  type Result,
  type ResultType,
} from "@repo/contracts/lms/_shared";
import { formatRepetitionLabel } from "@repo/contracts/lms/composition";
import {
  type BlockView,
  type ResolvedLoad,
  type RowView,
  type SchemaCardView,
  type SessionHeaderView,
} from "@repo/contracts/lms/session-detail";

import {
  ABSOLUTE_PAIR_PREFIX,
  AXIS_AND_SEPARATOR,
  BODYWEIGHT_LABEL,
  KG_LABEL,
  LOGGED_PREFIX,
  MONTH_LONG,
  ONE_RM_HINT_SUFFIX,
  PICK_YOUR_PREFIX,
  PROFILE_AXIS_SEPARATOR,
  PROFILE_GROUP_SEPARATOR,
  PROFILE_INNER_SEPARATOR,
  PROFILE_KG_SEPARATOR,
  REPS_LABEL,
  SCHEMA_BENCHMARK_BORDER_ALPHA,
  SET_ONE_RM_LABEL,
  SETS_SEPARATOR,
  SUB_LINE_SEPARATOR,
  SUMMARY_SEPARATOR,
  VOLUME_SEPARATOR,
  WEEKDAY_LONG,
} from "./athlete-session.constants";
import { formatIntensity } from "./format-intensity";
import { formatRepNotation } from "./format-rep-notation";
import { formatSide } from "./format-side";
import { formatTempoInput } from "./format-tempo-input";

const MODIFIER_SEPARATOR = ", ";
const SINGLE_AXIS_COUNT = 1;
const COUNTED_REP_KINDS = new Set<RepNotation["kind"]>(["count", "range"]);

export type CardDecoration = {
  borderColor: string;
};

export const resolveCardDecoration = (isBenchmark: boolean, theme: Theme): CardDecoration => ({
  borderColor: isBenchmark
    ? alpha(theme.palette.success.main, SCHEMA_BENCHMARK_BORDER_ALPHA)
    : theme.palette.divider,
});

export type ResolvedLoadCell = { state: "resolved"; value: string };
export type BodyweightLoadCell = { state: "bodyweight" };
export type OneRmLoadCell = { state: "missing_one_rm"; exerciseId: string; hint: string };
export type ProfilePickLoadCell = {
  state: "missing_profile_pick";
  spread: string;
  axisNames: string[];
};
export type EmptyLoadCell = { state: "empty" };

export type LoadCellModel =
  | ResolvedLoadCell
  | BodyweightLoadCell
  | OneRmLoadCell
  | ProfilePickLoadCell
  | EmptyLoadCell;

type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;
type ByProfileCell = ByProfileLoad["cells"][number];

const formatSingleAxisSpread = (cells: readonly ByProfileCell[]): string =>
  cells
    .map((cell) => `${cell.coords[0] ?? ""}${PROFILE_KG_SEPARATOR}${cell.kg}`)
    .join(PROFILE_GROUP_SEPARATOR);

const formatTwoAxisSpread = (cells: readonly ByProfileCell[]): string => {
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

const formatProfileSpread = (load: Load | null, axisNames: string[]): string => {
  if (load === null || load.kind !== "byProfile") {
    return axisNames.join(PROFILE_AXIS_SEPARATOR);
  }

  return load.axes.length === SINGLE_AXIS_COUNT
    ? formatSingleAxisSpread(load.cells)
    : formatTwoAxisSpread(load.cells);
};

const absoluteValue = (count: 1 | 2, kg: number): string =>
  `${count === 2 ? ABSOLUTE_PAIR_PREFIX : ""}${kg} ${KG_LABEL}`;

const resolvedValue = (load: Load | null, kg: number): string =>
  load !== null && load.kind === "absolute"
    ? absoluteValue(load.count, load.kg)
    : `${kg} ${KG_LABEL}`;

const oneRmHint = (load: Load | null): string =>
  load !== null && load.kind === "percentage"
    ? `${load.value}${ONE_RM_HINT_SUFFIX}`
    : ONE_RM_HINT_SUFFIX.trim();

export const resolveLoadCell = (
  resolvedLoad: ResolvedLoad | null,
  load: Load | null,
): LoadCellModel => {
  if (resolvedLoad === null) {
    return { state: "empty" };
  }

  switch (resolvedLoad.status) {
    case "resolved":
      return { state: "resolved", value: resolvedValue(load, resolvedLoad.kg) };
    case "bodyweight":
      return { state: "bodyweight" };
    case "not_applicable":
      return { state: "empty" };
    case "unresolved":
      return resolvedLoad.reason === "missing_one_rm"
        ? { state: "missing_one_rm", exerciseId: resolvedLoad.exerciseId, hint: oneRmHint(load) }
        : {
            state: "missing_profile_pick",
            spread: formatProfileSpread(load, resolvedLoad.axisNames),
            axisNames: resolvedLoad.axisNames,
          };
    default:
      resolvedLoad satisfies never;

      return { state: "empty" };
  }
};

export type LoadPrompt =
  | { kind: "one_rm"; exerciseId: string; label: string }
  | { kind: "profile"; label: string };

export type LoadLine = { loadStr: string; showAt: boolean; prompt: LoadPrompt | null };

export const buildLoadLine = (resolvedLoad: ResolvedLoad | null, load: Load | null): LoadLine => {
  const cell = resolveLoadCell(resolvedLoad, load);

  switch (cell.state) {
    case "empty":
      return { loadStr: "", showAt: false, prompt: null };
    case "bodyweight":
      return { loadStr: BODYWEIGHT_LABEL, showAt: true, prompt: null };
    case "resolved":
      return { loadStr: cell.value, showAt: true, prompt: null };
    case "missing_one_rm":
      return {
        loadStr: cell.hint,
        showAt: true,
        prompt: { kind: "one_rm", exerciseId: cell.exerciseId, label: SET_ONE_RM_LABEL },
      };
    case "missing_profile_pick":
      return {
        loadStr: cell.spread,
        showAt: false,
        prompt: {
          kind: "profile",
          label: `${PICK_YOUR_PREFIX}${cell.axisNames.join(AXIS_AND_SEPARATOR)}`,
        },
      };
    default:
      cell satisfies never;

      return { loadStr: "", showAt: false, prompt: null };
  }
};

const formatReps = (reps: RepNotation): string => {
  const notation = formatRepNotation(reps);

  return COUNTED_REP_KINDS.has(reps.kind) ? `${notation} ${REPS_LABEL}` : notation;
};

export const buildVolume = (row: RowView): string =>
  [
    row.sets !== null ? `${row.sets} ${SETS_SEPARATOR}` : "",
    row.reps !== null ? formatReps(row.reps) : "",
  ]
    .filter((part) => part.length > 0)
    .join(VOLUME_SEPARATOR);

export const buildRowSubLine = (row: RowView): string =>
  [
    formatTempoInput(row.tempo),
    row.side !== null ? formatSide(row.side) : "",
    formatIntensity(row.intensity),
    row.modifiers.map((modifier) => modifier.toUpperCase()).join(MODIFIER_SEPARATOR),
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
  existingResult: Result | null;
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

const ONCE_LABEL = "once";

export const benchmarkTitle = (schema: SchemaCardView): string => {
  const base = schema.header ?? firstMovement(schema) ?? schema.schemaId;
  const shape = schema.composition !== null ? formatRepetitionLabel(schema.composition) : null;

  return shape !== null && shape !== ONCE_LABEL ? `${base}${SUMMARY_SEPARATOR}${shape}` : base;
};

const toBenchmark = (schema: SchemaCardView): BenchmarkSchema | null => {
  if (!schema.isBenchmark || schema.resultType === null) {
    return null;
  }

  return {
    schemaId: schema.schemaId,
    title: benchmarkTitle(schema),
    resultType: schema.resultType,
    existingResult: schema.existingResult,
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
