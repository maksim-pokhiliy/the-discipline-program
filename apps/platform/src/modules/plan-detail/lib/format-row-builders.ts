import { type SchemaRow } from "@repo/contracts/lms/schema-row";

import { formatLoad } from "./format-load";
import { type ExerciseById } from "./format-percentage-reference";
import { formatRepNotation } from "./format-rep-notation";
import { type FormatRowResult } from "./format-row.types";
import { formatSide } from "./format-side";
import { formatTempo } from "./format-tempo";

const EXERCISE_FALLBACK = "exercise";
const SETS_SUFFIX = " ×";

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

const buildSubParts = (row: SchemaRow, exerciseById: ExerciseById): string[] => {
  const out: string[] = [];

  if (row.sets !== null) {
    out.push(`${row.sets}${SETS_SUFFIX}`);
  }

  if (row.reps !== null) {
    out.push(formatRepNotation(row.reps));
  }

  if (row.load !== null) {
    out.push(formatLoad(row.load, exerciseById));
  }

  if (row.side !== null) {
    out.push(`[${formatSide(row.side)}]`);
  }

  if (row.tempo !== null) {
    out.push(`[${typeof row.tempo === "string" ? row.tempo : formatTempo(row.tempo)}]`);
  }

  for (const modifier of row.modifiers) {
    out.push(`[${modifier.name}]`);
  }

  return out;
};

export const buildRow = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  index: number,
): FormatRowResult => {
  const placeholder = isPlaceholder(row.exerciseId, exerciseById);

  return {
    mainText: resolveExerciseName(row.exerciseId, exerciseById),
    subParts: buildSubParts(row, exerciseById),
    kindBadge: "EX",
    kindCls: "ex",
    dashed: placeholder,
    ord: String(index + 1),
    formPillText: null,
    demoUrl: resolveDemoUrl(row.exerciseId, exerciseById),
  };
};
