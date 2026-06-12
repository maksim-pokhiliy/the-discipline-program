import { type SchemaRow } from "@repo/contracts/lms/schema-row";

import { type ExerciseById } from "./format-percentage-reference";
import {
  REST_SLOT_RESULT,
  buildExercise,
  buildPlaceholder,
  buildRest,
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
    case "PLACEHOLDER":
      return buildPlaceholder(payload);
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
  const byKind = buildByKind(row, exerciseById, index);
  const base = row.media === null ? byKind : { ...byKind, demoUrl: row.media.url };

  if (row.notes === null || row.notes.length === 0) {
    return base;
  }

  return {
    ...base,
    subParts: [...base.subParts, `'${row.notes}'`],
  };
};
