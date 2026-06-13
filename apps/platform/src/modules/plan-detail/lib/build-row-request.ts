import type { ZodIssue } from "zod";

import type {
  Load,
  MediaReference,
  PerLimbDistribution,
  RepNotation,
  TempoModifier,
} from "@repo/contracts/lms/_shared";
import {
  type CreateSchemaRowRequest,
  createSchemaRowSchema,
  type UpdateSchemaRowRequest,
  updateSchemaRowSchema,
} from "@repo/contracts/lms/schema-row";

import { coachRowIssue } from "./coach-row-issue";
import { parseTempo } from "./parse-tempo";
import type { RowFormState, RowRequestMode } from "./row-form-state.types";

const NO_EXERCISE_ERROR = "Pick an exercise";
const REQUEST_BUILD_FALLBACK = "could not build the row request.";

export type RowRequestResult =
  | { ok: true; data: CreateSchemaRowRequest | UpdateSchemaRowRequest }
  | { ok: false; error: string };

type RowRequestPayload = {
  sets: number | null;
  load: Load | null;
  reps: RepNotation | null;
  side: PerLimbDistribution | null;
  tempo: TempoModifier | null;
  media: MediaReference | null;
  modifierIds: string[];
  notes: string[] | null;
};

const buildMedia = (url: string, label: string): MediaReference | null => {
  const trimmedUrl = url.trim();

  if (trimmedUrl === "") {
    return null;
  }

  const trimmedLabel = label.trim();

  return trimmedLabel === "" ? { url: trimmedUrl } : { url: trimmedUrl, label: trimmedLabel };
};

const buildNotes = (notes: string[]): string[] | null => {
  const cleaned = notes.map((note) => note.trim()).filter((note) => note !== "");

  return cleaned.length === 0 ? null : cleaned;
};

const issueToError = (issues: ZodIssue[]): string => {
  const [issue] = issues;

  return issue === undefined ? REQUEST_BUILD_FALLBACK : coachRowIssue(issue);
};

export const buildRowRequest = (state: RowFormState, mode: RowRequestMode): RowRequestResult => {
  const tempo = parseTempo(state.tempoInput);

  if (!tempo.ok) {
    return { ok: false, error: tempo.error };
  }

  const payload: RowRequestPayload = {
    sets: state.sets,
    load: state.load,
    reps: state.reps,
    side: state.side,
    tempo: tempo.value,
    media: buildMedia(state.mediaUrl, state.mediaLabel),
    modifierIds: state.modifierIds,
    notes: buildNotes(state.notes),
  };

  if (mode.kind === "edit") {
    const parsed = updateSchemaRowSchema.safeParse(payload);

    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, error: issueToError(parsed.error.issues) };
  }

  if (state.exerciseId === null) {
    return { ok: false, error: NO_EXERCISE_ERROR };
  }

  const parsed = createSchemaRowSchema.safeParse({
    schemaId: mode.schemaId,
    exerciseId: state.exerciseId,
    ...payload,
  });

  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, error: issueToError(parsed.error.issues) };
};
