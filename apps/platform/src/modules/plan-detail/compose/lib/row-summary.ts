import type { Exercise } from "@repo/contracts/lms/exercise";
import type { RowKind } from "@repo/contracts/lms/schema-row";
import type { RowKind as BadgeKind } from "@repo/ui";

import type { ExerciseFormValue } from "../../components/exercise-form-draft.types";
import type { ComposeRow } from "../compose-tree.types";

import { isRowCommitted } from "./make-row";

type RowBadge = { kind: BadgeKind; label: string; dashed: boolean };

const ROW_BADGES: Record<RowKind, RowBadge> = {
  EXERCISE: { kind: "ex", label: "EX", dashed: false },
  REST: { kind: "rest", label: "RST", dashed: false },
  FOOTNOTE: { kind: "foot", label: "FN", dashed: false },
  STANDALONE_LOAD: { kind: "load", label: "LD", dashed: false },
  STANDALONE_URL: { kind: "url", label: "URL", dashed: false },
  PLACEHOLDER: { kind: "placeholder", label: "?", dashed: true },
  INNER_LADDER_MARKER: { kind: "ladder", label: "↓", dashed: true },
  REP_DEFINITION: { kind: "ex", label: "≡", dashed: false },
  REST_SLOT: { kind: "rest", label: "RS", dashed: false },
};

const UNCOMMITTED_LABEL = "tap to set up…";

const exerciseFormLabel = (
  form: ExerciseFormValue,
  exerciseById: Map<string, Exercise>,
): string => {
  switch (form.form) {
    case "atomic":
      return form.exerciseId === null
        ? "pick exercise"
        : (exerciseById.get(form.exerciseId)?.canonicalName ?? "exercise");
    case "compound":
      return form.compound.elements
        .map((element) =>
          element.exerciseId === null
            ? "?"
            : (exerciseById.get(element.exerciseId)?.canonicalName ?? "?"),
        )
        .join(" + ");
    case "cyclical":
      return "cyclical couplet";
    case "sandwich":
      return "sandwich";
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
      return exerciseFormLabel(payload.exercise, exerciseById);
    case "REST":
      return payload.raw;
    case "FOOTNOTE":
      return "footnote";
    case "STANDALONE_LOAD":
      return "load";
    case "STANDALONE_URL":
      return payload.url;
    case "PLACEHOLDER":
      return "placeholder";
    case "INNER_LADDER_MARKER":
      return payload.steps.join("-");
    case "REP_DEFINITION":
      return "rep definition";
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
