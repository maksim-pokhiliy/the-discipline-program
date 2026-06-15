import { type RepNotation } from "@repo/contracts/lms/_shared";
import { type ExerciseNature } from "@repo/contracts/lms/exercise";
import { type SchemaRow } from "@repo/contracts/lms/schema-row";
import { type RowKind } from "@repo/ui";

import { formatLoad } from "./format-load";
import { type ExerciseById } from "./format-percentage-reference";
import { formatRepNotation } from "./format-rep-notation";
import { type FormatRowResult, type RowSummary } from "./format-row.types";
import { formatSide } from "./format-side";
import { formatTempo } from "./format-tempo";

const EXERCISE_FALLBACK = "exercise";
const SETS_SUFFIX = "×";
const VOLUME_SEPARATOR = " ";
const REPS_LABEL = "reps";
const COUNTED_REP_KINDS = new Set<RepNotation["kind"]>(["count", "range"]);

type RenderKind = { kindBadge: string; kindCls: RowKind; dashed: boolean };

const CONCRETE_RENDER_KIND: RenderKind = { kindBadge: "EX", kindCls: "ex", dashed: false };

const NATURE_RENDER_KIND: Record<ExerciseNature, RenderKind> = {
  CONCRETE: CONCRETE_RENDER_KIND,
  PLACEHOLDER: { kindBadge: "EX", kindCls: "ex", dashed: true },
  REST: { kindBadge: "REST", kindCls: "rest", dashed: false },
};

const resolveExerciseName = (exerciseId: string, exerciseById: ExerciseById): string =>
  exerciseById.get(exerciseId)?.canonicalName ?? EXERCISE_FALLBACK;

const resolveRenderKind = (exerciseId: string, exerciseById: ExerciseById): RenderKind => {
  const exercise = exerciseById.get(exerciseId);

  return exercise === undefined ? CONCRETE_RENDER_KIND : NATURE_RENDER_KIND[exercise.nature];
};

const resolveDemoUrl = (exerciseId: string, exerciseById: ExerciseById): string | null => {
  const exercise = exerciseById.get(exerciseId);

  if (exercise === undefined || exercise.nature === "PLACEHOLDER") {
    return null;
  }

  return exercise.defaultDemoUrls[0] ?? null;
};

const buildReps = (reps: RepNotation): string => {
  const notation = formatRepNotation(reps);

  return COUNTED_REP_KINDS.has(reps.kind) ? `${notation} ${REPS_LABEL}` : notation;
};

const buildVolume = (row: SchemaRow): string | null => {
  const setsPart = row.sets !== null ? `${row.sets} ${SETS_SUFFIX}` : null;
  const repsPart = row.reps !== null ? buildReps(row.reps) : null;

  return [setsPart, repsPart].filter(Boolean).join(VOLUME_SEPARATOR) || null;
};

const buildSummary = (row: SchemaRow, exerciseById: ExerciseById): RowSummary => ({
  volume: buildVolume(row),
  load: row.load !== null ? formatLoad(row.load, exerciseById) : null,
  side: row.side !== null ? formatSide(row.side) : null,
  tempo:
    row.tempo !== null
      ? typeof row.tempo === "string"
        ? row.tempo
        : formatTempo(row.tempo)
      : null,
  modifiers: row.modifiers.map((modifier) => modifier.name),
  notes: [],
});

export const buildRow = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  index: number,
): FormatRowResult => {
  const renderKind = resolveRenderKind(row.exerciseId, exerciseById);

  return {
    mainText: resolveExerciseName(row.exerciseId, exerciseById),
    summary: buildSummary(row, exerciseById),
    kindBadge: renderKind.kindBadge,
    kindCls: renderKind.kindCls,
    dashed: renderKind.dashed,
    ord: String(index + 1),
    formPillText: null,
    demoUrl: resolveDemoUrl(row.exerciseId, exerciseById),
  };
};
