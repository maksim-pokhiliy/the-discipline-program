import { alpha, type Theme } from "@mui/material";

import { type RepNotation, type Result, type ResultType } from "@repo/contracts/lms/_shared";
import { formatRepetitionLabel } from "@repo/contracts/lms/composition";
import {
  type BlockView,
  type RowView,
  type SchemaCardView,
  type SessionHeaderView,
} from "@repo/contracts/lms/session-detail";

import { formatRepNotation, formatSide, formatTempoInput } from "@app/lib/training-format";

import {
  LOGGED_PREFIX,
  MONTH_LONG,
  REPS_LABEL,
  SCHEMA_BENCHMARK_BORDER_ALPHA,
  SETS_SEPARATOR,
  SUB_LINE_SEPARATOR,
  SUMMARY_SEPARATOR,
  VOLUME_SEPARATOR,
  WEEKDAY_LONG,
} from "./athlete-session.constants";
import { formatIntensity } from "./format-intensity";

const MODIFIER_SEPARATOR = ", ";
const COUNTED_REP_KINDS = new Set<RepNotation["kind"]>(["count", "range"]);

export type CardDecoration = {
  borderColor: string;
};

export const resolveCardDecoration = (isBenchmark: boolean, theme: Theme): CardDecoration => ({
  borderColor: isBenchmark
    ? alpha(theme.palette.success.main, SCHEMA_BENCHMARK_BORDER_ALPHA)
    : theme.palette.divider,
});

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

const collectSchemaRows = (schema: SchemaCardView): RowView[] =>
  schema.items.flatMap((item) => (item.kind === "row" ? [item.row] : item.members));

export const collectRowViews = (blocks: BlockView[]): RowView[] =>
  blocks.flatMap(collectSchemaCards).flatMap(collectSchemaRows);

export const collectBenchmarkSchemas = (blocks: BlockView[]): BenchmarkSchema[] =>
  blocks
    .flatMap(collectSchemaCards)
    .map(toBenchmark)
    .filter((entry): entry is BenchmarkSchema => entry !== null);
