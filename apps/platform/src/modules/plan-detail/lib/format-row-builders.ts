import { type CompoundRowElement, type ExerciseForm } from "@repo/contracts/lms/_shared";
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
const URL_FALLBACK = "URL";
const PLACEHOLDER_TEXT_FALLBACK = "any exercise";
const FOOTNOTE_FALLBACK = "footnote";
const UNKNOWN_EXERCISE_FALLBACK = "?";
const STANDALONE_LOAD_SUB = "applies to all rows above";
const STANDALONE_LOAD_FIRST_ROW_SUB = "global load";
const STANDALONE_URL_WHOLE_SCHEMA_SUB = "schema reference";
const STANDALONE_URL_PREVIOUS_ROW_SUB = "previous-row demo";
const INNER_LADDER_MARKER_SUB = "ladder marker — segments rows below";
const REP_DEFINITION_SUB = "rep definition";
const PLACEHOLDER_SUB_PREFIX = "placeholder · ";
const UNDERSCORE_RE = /_/g;
const UNDERSCORE_REPLACEMENT = " ";

const FORM_PILL_BY_KIND: Record<ExerciseForm["form"], string | null> = {
  atomic: null,
  compound: "compound",
  cyclical: "cyclical",
  sandwich: "sandwich",
  or_alternative: "or alternative",
  placeholder_ref: "placeholder ref",
};

const lookupName = (id: string, exerciseById: ExerciseById, fallback: string): string =>
  exerciseById.get(id)?.canonicalName ?? fallback;

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

const joinFootnoteElements = (
  elements: ReadonlyArray<CompoundRowElement>,
  exerciseById: ExerciseById,
): string =>
  elements
    .map(
      (el) =>
        `${lookupName(el.exerciseId, exerciseById, UNKNOWN_EXERCISE_FALLBACK)} × ${formatRepNotation(el.reps)}`,
    )
    .join(" + ");

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

export const buildFootnote = (
  payload: Extract<SchemaRowPayload, { rowKind: "FOOTNOTE" }>,
  notes: string | null,
  exerciseById: ExerciseById,
): FormatRowResult => {
  const elementsText = joinFootnoteElements(payload.content.elements, exerciseById);
  const body =
    elementsText.length > 0
      ? elementsText
      : notes !== null && notes.length > 0
        ? notes
        : FOOTNOTE_FALLBACK;
  const target = payload.target.replace(UNDERSCORE_RE, UNDERSCORE_REPLACEMENT);

  return {
    mainText: `${payload.marker} ${body} (${target})`,
    subParts: [],
    kindBadge: "FN",
    kindCls: "foot",
    dashed: false,
    ord: payload.marker,
    formPillText: null,
    demoUrl: null,
  };
};

export const buildStandaloneLoad = (
  payload: Extract<SchemaRowPayload, { rowKind: "STANDALONE_LOAD" }>,
  exerciseById: ExerciseById,
  index: number,
): FormatRowResult => {
  const text = formatLoad(payload.load, exerciseById);

  return {
    mainText: text.length > 0 ? text : "Load",
    subParts: [index === 0 ? STANDALONE_LOAD_FIRST_ROW_SUB : STANDALONE_LOAD_SUB],
    kindBadge: "LD",
    kindCls: "load",
    dashed: false,
    ord: "L",
    formPillText: null,
    demoUrl: null,
  };
};

export const buildStandaloneUrl = (
  payload: Extract<SchemaRowPayload, { rowKind: "STANDALONE_URL" }>,
): FormatRowResult => ({
  mainText: payload.url.length > 0 ? payload.url : URL_FALLBACK,
  subParts: [
    payload.appliesTo === "whole_schema"
      ? STANDALONE_URL_WHOLE_SCHEMA_SUB
      : STANDALONE_URL_PREVIOUS_ROW_SUB,
  ],
  kindBadge: "URL",
  kindCls: "url",
  dashed: false,
  ord: "U",
  formPillText: null,
  demoUrl: null,
});

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

export const buildInnerLadderMarker = (
  payload: Extract<SchemaRowPayload, { rowKind: "INNER_LADDER_MARKER" }>,
): FormatRowResult => {
  const joined = payload.steps.join("-");
  const mainText = payload.steps.length > 1 ? `${joined} :` : joined;

  return {
    mainText,
    subParts: [INNER_LADDER_MARKER_SUB],
    kindBadge: "↓",
    kindCls: "ladder",
    dashed: true,
    ord: "—",
    formPillText: null,
    demoUrl: null,
  };
};

export const buildRepDefinition = (
  payload: Extract<SchemaRowPayload, { rowKind: "REP_DEFINITION" }>,
  exerciseById: ExerciseById,
): FormatRowResult => {
  const composition = payload.equality.composition
    .map((c) => `${c.count}× ${lookupName(c.exerciseId, exerciseById, UNKNOWN_EXERCISE_FALLBACK)}`)
    .join(" + ");

  return {
    mainText: `${payload.equality.totalReps} reps = ${composition}`,
    subParts: [REP_DEFINITION_SUB],
    kindBadge: "≡",
    kindCls: "ex",
    dashed: false,
    ord: "≡",
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
