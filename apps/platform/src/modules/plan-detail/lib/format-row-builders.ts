import { type SchemaRow } from "@repo/contracts/lms/schema-row";

import { formatLoad } from "./format-load";
import { type ExerciseById } from "./format-percentage-reference";
import { formatRepNotation } from "./format-rep-notation";
import { type FormatRowResult, type RowSummary } from "./format-row.types";
import { formatSide } from "./format-side";
import { formatTempo } from "./format-tempo";

const EXERCISE_FALLBACK = "exercise";
const SETS_SUFFIX = "×";
const VOLUME_SEPARATOR = " ";

const resolveExerciseName = (exerciseId: string, exerciseById: ExerciseById): string =>
  exerciseById.get(exerciseId)?.canonicalName ?? EXERCISE_FALLBACK;

const isPlaceholder = (exerciseId: string, exerciseById: ExerciseById): boolean =>
  exerciseById.get(exerciseId)?.placeholderFlag === true;

const resolveDemoUrl = (exerciseId: string, exerciseById: ExerciseById): string | null => {
  const exercise = exerciseById.get(exerciseId);

  if (exercise === undefined || exercise.placeholderFlag) {
    return null;
  }

  return exercise.defaultDemoUrls[0] ?? null;
};

const buildVolume = (row: SchemaRow): string | null => {
  const setsPart = row.sets !== null ? `${row.sets} ${SETS_SUFFIX}` : null;
  const repsPart = row.reps !== null ? formatRepNotation(row.reps) : null;

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
  const placeholder = isPlaceholder(row.exerciseId, exerciseById);

  return {
    mainText: resolveExerciseName(row.exerciseId, exerciseById),
    summary: buildSummary(row, exerciseById),
    kindBadge: "EX",
    kindCls: "ex",
    dashed: placeholder,
    ord: String(index + 1),
    formPillText: null,
    demoUrl: resolveDemoUrl(row.exerciseId, exerciseById),
  };
};
