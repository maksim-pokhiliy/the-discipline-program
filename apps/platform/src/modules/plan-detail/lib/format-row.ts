import { type SchemaRow } from "@repo/contracts/lms/schema-row";

import { type ExerciseById } from "./format-percentage-reference";
import { buildRow } from "./format-row-builders";
import { type FormatRowResult } from "./format-row.types";

export { type ExerciseById } from "./format-percentage-reference";
export { type FormatRowResult, type RowSummary } from "./format-row.types";

export const formatRow = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  index: number,
): FormatRowResult => {
  const built = buildRow(row, exerciseById, index);
  const base = row.media === null ? built : { ...built, demoUrl: row.media.url };
  const notes = row.notes ?? [];

  return { ...base, summary: { ...base.summary, notes } };
};
