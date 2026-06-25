import { type ExerciseById, type RowIntensityContext } from "@repo/contracts/lms/row-text";
import { type SchemaRow } from "@repo/contracts/lms/schema-row";

import { buildRow } from "./format-row-builders";
import { type FormatRowResult } from "./format-row.types";

export { type ExerciseById, type RowIntensityContext } from "@repo/contracts/lms/row-text";
export { type FormatRowResult, type RowSummary } from "./format-row.types";

const EMPTY_INTENSITY_CONTEXT: RowIntensityContext = {
  blockIntensity: null,
  schemaIntensity: null,
};

export const formatRow = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  index: number,
  context: RowIntensityContext = EMPTY_INTENSITY_CONTEXT,
): FormatRowResult => {
  const built = buildRow(row, exerciseById, index, context);
  const base = row.media === null ? built : { ...built, demoUrl: row.media.url };
  const notes = row.notes ?? [];

  return { ...base, summary: { ...base.summary, notes } };
};
