import { type SchemaRow } from "@repo/contracts/lms/schema-row";

import { type ExerciseById } from "./format-percentage-reference";
import {
  REST_SLOT_RESULT,
  buildExercise,
  buildFootnote,
  buildInnerLadderMarker,
  buildPlaceholder,
  buildRepDefinition,
  buildRest,
  buildStandaloneLoad,
  buildStandaloneUrl,
} from "./format-row-builders";
import { type FormatRowResult } from "./format-row.types";

export { type ExerciseById } from "./format-percentage-reference";
export { type FormatRowResult } from "./format-row.types";

const buildByKind = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  index: number,
): FormatRowResult => {
  const payload = row.rowPayload;

  switch (payload.rowKind) {
    case "EXERCISE":
      return buildExercise(row, payload.exercise, exerciseById, index);
    case "REST":
      return buildRest(payload, index);
    case "FOOTNOTE":
      return buildFootnote(payload, row.notes, exerciseById);
    case "STANDALONE_LOAD":
      return buildStandaloneLoad(payload, exerciseById, index);
    case "STANDALONE_URL":
      return buildStandaloneUrl(payload);
    case "PLACEHOLDER":
      return buildPlaceholder(payload);
    case "INNER_LADDER_MARKER":
      return buildInnerLadderMarker(payload);
    case "REP_DEFINITION":
      return buildRepDefinition(payload, exerciseById);
    case "REST_SLOT":
      return REST_SLOT_RESULT;
    default:
      payload satisfies never;

      return REST_SLOT_RESULT;
  }
};

export const formatRow = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  index: number,
): FormatRowResult => {
  const base = buildByKind(row, exerciseById, index);

  if (row.notes === null || row.notes.length === 0 || row.rowPayload.rowKind === "FOOTNOTE") {
    return base;
  }

  return {
    ...base,
    subParts: [...base.subParts, `'${row.notes}'`],
  };
};
