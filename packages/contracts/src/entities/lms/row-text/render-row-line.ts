import { type Intensity, type RepNotation } from "../_shared";
import { formatRestSpec } from "../composition";
import { type SchemaRow } from "../schema-row";

import { formatLoad } from "./format-load";
import { type ExerciseById } from "./format-percentage-reference";
import { formatRepNotation } from "./format-rep-notation";
import { formatSide } from "./format-side";
import { formatTempo } from "./format-tempo";
import { type EmphasizedIntensityText, buildEffectiveIntensityTexts } from "./intensity-text";
import { resolveIntensity } from "./resolve-intensity";

const EXERCISE_FALLBACK = "exercise";
const SETS_SUFFIX = "×";
const VOLUME_SEPARATOR = " ";
const REPS_LABEL = "reps";
const ROW_INTENSITY_LEVEL = "row";
const LINE_SEPARATOR = " ";
const NOTES_SEPARATOR = " · ";
const COUNTED_REP_KINDS = new Set<RepNotation["kind"]>(["count", "range"]);

export type RowIntensityContext = {
  blockIntensity: Intensity | null;
  schemaIntensity: Intensity | null;
};

export type RowSummaryTexts = {
  volume: string | null;
  load: string | null;
  side: string | null;
  tempo: string | null;
  intensityTexts: EmphasizedIntensityText[];
  rest: string | null;
  modifiers: string[];
  notes: string[];
};

const resolveExerciseName = (exerciseId: string, exerciseById: ExerciseById): string =>
  exerciseById.get(exerciseId)?.canonicalName ?? EXERCISE_FALLBACK;

const buildReps = (reps: RepNotation): string => {
  const notation = formatRepNotation(reps);

  return COUNTED_REP_KINDS.has(reps.kind) ? `${notation} ${REPS_LABEL}` : notation;
};

const buildVolume = (row: SchemaRow): string | null => {
  const setsPart = row.sets !== null ? `${row.sets} ${SETS_SUFFIX}` : null;
  const repsPart = row.reps !== null ? buildReps(row.reps) : null;

  return [setsPart, repsPart].filter(Boolean).join(VOLUME_SEPARATOR) || null;
};

const buildTempo = (tempo: SchemaRow["tempo"]): string | null => {
  if (tempo === null) {
    return null;
  }

  return typeof tempo === "string" ? tempo : formatTempo(tempo);
};

export const buildRowSummaryTexts = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  context: RowIntensityContext,
): RowSummaryTexts => {
  const resolved = resolveIntensity(context.blockIntensity, context.schemaIntensity, row.intensity);

  return {
    volume: buildVolume(row),
    load: row.load !== null ? formatLoad(row.load, exerciseById) : null,
    side: row.side !== null ? formatSide(row.side) : null,
    tempo: buildTempo(row.tempo),
    intensityTexts: buildEffectiveIntensityTexts(resolved, ROW_INTENSITY_LEVEL),
    rest: row.rest !== null ? formatRestSpec(row.rest) : null,
    modifiers: row.modifiers.map((modifier) => modifier.name),
    notes: row.notes ?? [],
  };
};

export const renderRowLine = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  context: RowIntensityContext,
): string => {
  const summary = buildRowSummaryTexts(row, exerciseById, context);
  const parts: string[] = [resolveExerciseName(row.exerciseId, exerciseById)];

  if (summary.volume !== null) {
    parts.push(summary.volume);
  }

  if (summary.load !== null) {
    parts.push(summary.load);
  }

  if (summary.side !== null) {
    parts.push(summary.side);
  }

  if (summary.tempo !== null) {
    parts.push(summary.tempo);
  }

  for (const chip of summary.intensityTexts) {
    parts.push(chip.text);
  }

  if (summary.rest !== null) {
    parts.push(summary.rest);
  }

  for (const modifier of summary.modifiers) {
    parts.push(modifier);
  }

  if (summary.notes.length > 0) {
    parts.push(summary.notes.join(NOTES_SEPARATOR));
  }

  return parts.join(LINE_SEPARATOR);
};
