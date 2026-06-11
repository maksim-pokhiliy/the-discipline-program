import type { RepNotation } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { RowKind } from "@repo/contracts/lms/schema-row";
import type { RowKind as BadgeKind } from "@repo/ui";

import type { ComposeRow } from "../components/axes/axis-draft.types";
import type { ExerciseFormValue } from "../components/exercise-form-draft.types";

import { formatLoad } from "./format-load";
import { formatRepNotation } from "./format-rep-notation";

export const isRowCommitted = (row: ComposeRow): boolean => row.rowPayload.rowKind === row.rowKind;

type RowBadge = { kind: BadgeKind; label: string; dashed: boolean };

const ROW_BADGES: Record<RowKind, RowBadge> = {
  EXERCISE: { kind: "ex", label: "EX", dashed: false },
  REST: { kind: "rest", label: "RST", dashed: false },
  PLACEHOLDER: { kind: "placeholder", label: "?", dashed: true },
  REST_SLOT: { kind: "rest", label: "RS", dashed: false },
};

const UNCOMMITTED_LABEL = "tap to set up…";
const PART_SEPARATOR = " · ";
const COMPOUND_SEPARATOR = " + ";
const REPS_SUFFIX = / reps$/;

const exerciseName = (exerciseId: string | null, exerciseById: Map<string, Exercise>): string =>
  exerciseId === null
    ? "pick exercise"
    : (exerciseById.get(exerciseId)?.canonicalName ?? "exercise");

const compactReps = (reps: RepNotation): string => formatRepNotation(reps).replace(REPS_SUFFIX, "");

const compoundLabel = (
  compound: Extract<ExerciseFormValue, { form: "compound" }>["compound"],
  exerciseById: Map<string, Exercise>,
): string =>
  compound.elements
    .map(
      (element) => `${compactReps(element.reps)} ${exerciseName(element.exerciseId, exerciseById)}`,
    )
    .join(COMPOUND_SEPARATOR);

const atomicLabel = (
  exerciseId: string | null,
  row: ComposeRow,
  exerciseById: Map<string, Exercise>,
): string => {
  const parts = [exerciseName(exerciseId, exerciseById)];

  if (row.load !== null && row.load.kind !== "none") {
    parts.push(formatLoad(row.load, exerciseById));
  }

  if (row.reps !== null) {
    parts.push(formatRepNotation(row.reps));
  }

  return parts.join(PART_SEPARATOR);
};

const exerciseLabel = (
  form: ExerciseFormValue,
  row: ComposeRow,
  exerciseById: Map<string, Exercise>,
): string => {
  switch (form.form) {
    case "atomic":
      return atomicLabel(form.exerciseId, row, exerciseById);
    case "compound":
      return compoundLabel(form.compound, exerciseById);
    case "or_alternative":
      return "either / or";
    case "placeholder_ref":
      return "placeholder";
    default:
      form satisfies never;

      return "exercise";
  }
};

const committedLabel = (row: ComposeRow, exerciseById: Map<string, Exercise>): string => {
  const payload = row.rowPayload;

  switch (payload.rowKind) {
    case "EXERCISE":
      return exerciseLabel(payload.exercise, row, exerciseById);
    case "REST":
      return payload.raw;
    case "PLACEHOLDER":
      return "placeholder";
    case "REST_SLOT":
      return "rest slot";
    default:
      payload satisfies never;

      return "";
  }
};

export type RowSummary = { badge: RowBadge; label: string };

export const buildRowSummary = (
  row: ComposeRow,
  exerciseById: Map<string, Exercise>,
): RowSummary => ({
  badge: ROW_BADGES[row.rowKind],
  label: isRowCommitted(row) ? committedLabel(row, exerciseById) : UNCOMMITTED_LABEL,
});
