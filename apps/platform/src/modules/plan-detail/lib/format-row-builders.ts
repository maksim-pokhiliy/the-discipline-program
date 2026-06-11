import { type ExerciseForm } from "@repo/contracts/lms/_shared";
import { type SchemaRow, type SchemaRowPayload } from "@repo/contracts/lms/schema-row";

import { formatIntensityChips, intensityHasAny } from "./format-block-meta";
import { formatExerciseForm } from "./format-exercise-form";
import { formatLoad } from "./format-load";
import { type ExerciseById } from "./format-percentage-reference";
import { formatPosition } from "./format-position";
import { formatRepNotation } from "./format-rep-notation";
import { formatRestSpec } from "./format-rest-spec";
import { type FormatRowResult } from "./format-row.types";
import { formatSequenceIndicator } from "./format-sequence-indicator";
import { formatSide } from "./format-side";
import { formatTempo } from "./format-tempo";

const REST_FALLBACK = "Rest";
const PLACEHOLDER_TEXT_FALLBACK = "any exercise";
const PLACEHOLDER_SUB_PREFIX = "placeholder · ";
const UNDERSCORE_RE = /_/g;
const UNDERSCORE_REPLACEMENT = " ";

const FORM_PILL_BY_KIND: Record<ExerciseForm["form"], string | null> = {
  atomic: null,
  compound: "compound",
  or_alternative: "or alternative",
  placeholder_ref: "placeholder ref",
};

const isAtomicPlaceholder = (form: ExerciseForm, exerciseById: ExerciseById): boolean => {
  if (form.form !== "atomic") {
    return false;
  }

  return exerciseById.get(form.exerciseId)?.placeholderFlag === true;
};

const computeDemoUrl = (form: ExerciseForm, exerciseById: ExerciseById): string | null => {
  if (form.form !== "atomic") {
    return null;
  }

  if (exerciseById.get(form.exerciseId)?.placeholderFlag === true) {
    return null;
  }

  return exerciseById.get(form.exerciseId)?.defaultDemoUrls[0] ?? null;
};

const buildExerciseSubParts = (
  row: SchemaRow,
  form: ExerciseForm,
  exerciseById: ExerciseById,
): string[] => {
  const out: string[] = [];

  if (row.reps !== null) {
    out.push(formatRepNotation(row.reps));
  }

  if (row.load !== null) {
    out.push(formatLoad(row.load, exerciseById));
  }

  if (row.side !== null) {
    out.push(formatSide(row.side));
  }

  if (row.tempo !== null) {
    const text = formatTempo(row.tempo);

    if (text.length > 0) {
      out.push(text);
    }
  }

  if (row.position !== null) {
    out.push(formatPosition(row.position));
  }

  if (intensityHasAny(row.intensity)) {
    for (const chip of formatIntensityChips(row.intensity)) {
      out.push(chip.text);
    }
  }

  if (row.sequence !== null) {
    out.push(formatSequenceIndicator(row.sequence));
  }

  for (const part of formatExerciseForm(form, exerciseById).sub) {
    out.push(part);
  }

  return out;
};

export const buildExercise = (
  row: SchemaRow,
  form: ExerciseForm,
  exerciseById: ExerciseById,
  index: number,
): FormatRowResult => {
  const placeholderAtomic = isAtomicPlaceholder(form, exerciseById);

  return {
    mainText: formatExerciseForm(form, exerciseById).name,
    subParts: buildExerciseSubParts(row, form, exerciseById),
    kindBadge: "EX",
    kindCls: "ex",
    dashed: placeholderAtomic,
    ord: String(index + 1),
    formPillText: placeholderAtomic ? "placeholder ref" : FORM_PILL_BY_KIND[form.form],
    demoUrl: computeDemoUrl(form, exerciseById),
  };
};

export const buildRest = (
  payload: Extract<SchemaRowPayload, { rowKind: "REST" }>,
  index: number,
): FormatRowResult => {
  const restText = formatRestSpec(payload.parsed);
  const mainText =
    restText.length > 0 ? restText : payload.raw.length > 0 ? payload.raw : REST_FALLBACK;

  return {
    mainText,
    subParts: [],
    kindBadge: "RST",
    kindCls: "rest",
    dashed: false,
    ord: String(index + 1),
    formPillText: null,
    demoUrl: null,
  };
};

export const buildPlaceholder = (
  payload: Extract<SchemaRowPayload, { rowKind: "PLACEHOLDER" }>,
): FormatRowResult => {
  const text =
    payload.placeholder.text.length > 0 ? payload.placeholder.text : PLACEHOLDER_TEXT_FALLBACK;
  const kindLabel = payload.placeholder.placeholderKind.replace(
    UNDERSCORE_RE,
    UNDERSCORE_REPLACEMENT,
  );

  return {
    mainText: text,
    subParts: [`${PLACEHOLDER_SUB_PREFIX}${kindLabel}`],
    kindBadge: "?",
    kindCls: "placeholder",
    dashed: true,
    ord: "?",
    formPillText: null,
    demoUrl: null,
  };
};

export const REST_SLOT_RESULT: FormatRowResult = {
  mainText: "Rest slot",
  subParts: ["EMOM minute · rest"],
  kindBadge: "RS",
  kindCls: "rest",
  dashed: false,
  ord: "R",
  formPillText: null,
  demoUrl: null,
};
