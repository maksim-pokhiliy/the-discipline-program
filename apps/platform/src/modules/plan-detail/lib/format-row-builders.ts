import { type ExerciseNature } from "@repo/contracts/lms/exercise";
import {
  type ExerciseById,
  type RowIntensityContext,
  buildRowSummaryTexts,
} from "@repo/contracts/lms/row-text";
import { type SchemaRow } from "@repo/contracts/lms/schema-row";
import { type RowKind } from "@repo/ui";

import { toEmphasizedIntensityChips } from "./format-block-meta";
import { type FormatRowResult, type RowSummary } from "./format-row.types";

const EXERCISE_FALLBACK = "exercise";

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

const buildSummary = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  context: RowIntensityContext,
): RowSummary => {
  const texts = buildRowSummaryTexts(row, exerciseById, context);

  return {
    volume: texts.volume,
    load: texts.load,
    side: texts.side,
    tempo: texts.tempo,
    intensityChips: toEmphasizedIntensityChips(texts.intensityTexts),
    rest: texts.rest,
    modifiers: texts.modifiers,
    notes: [],
  };
};

export const buildRow = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  index: number,
  context: RowIntensityContext,
): FormatRowResult => {
  const renderKind = resolveRenderKind(row.exerciseId, exerciseById);

  return {
    mainText: resolveExerciseName(row.exerciseId, exerciseById),
    summary: buildSummary(row, exerciseById, context),
    kindBadge: renderKind.kindBadge,
    kindCls: renderKind.kindCls,
    dashed: renderKind.dashed,
    ord: String(index + 1),
    formPillText: null,
    demoUrl: resolveDemoUrl(row.exerciseId, exerciseById),
  };
};
