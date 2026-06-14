import type { ZodIssue } from "zod";

import type {
  Load,
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
  | { ok: false; error: string; field?: string };

type RowRequestPayload = {
  sets: number | null;
  load: Load | null;
  reps: RepNotation | null;
  side: PerLimbDistribution | null;
  tempo: TempoModifier | null;
  modifierIds: string[];
  notes: string[] | null;
};

const buildNotes = (notes: string[]): string[] | null => {
  const cleaned = notes.map((note) => note.trim()).filter((note) => note !== "");

  return cleaned.length === 0 ? null : cleaned;
};

const issueToError = (issues: ZodIssue[]): { error: string; field?: string } => {
  const [issue] = issues;

  if (issue === undefined) {
    return { error: REQUEST_BUILD_FALLBACK };
  }

  const field = typeof issue.path[0] === "string" ? issue.path[0] : undefined;

  return { error: coachRowIssue(issue), ...(field !== undefined && { field }) };
};

export const buildRowRequest = (state: RowFormState, mode: RowRequestMode): RowRequestResult => {
  const payload: RowRequestPayload = {
    sets: state.sets,
    load: state.load,
    reps: state.reps,
    side: state.side,
    tempo: parseTempo(state.tempoInput),
    modifierIds: state.modifierIds,
    notes: buildNotes(state.notes),
  };

  if (mode.kind === "edit") {
    const parsed = updateSchemaRowSchema.safeParse(payload);

    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, ...issueToError(parsed.error.issues) };
  }

  if (state.exerciseId === null) {
    return { ok: false, error: NO_EXERCISE_ERROR, field: "exerciseId" };
  }

  const parsed = createSchemaRowSchema.safeParse({
    schemaId: mode.schemaId,
    exerciseId: state.exerciseId,
    ...payload,
  });

  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, ...issueToError(parsed.error.issues) };
};
