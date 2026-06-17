import { type SchemaRow } from "@repo/contracts/lms/schema-row";

import { type ExerciseById } from "./format-percentage-reference";
import { buildRow } from "./format-row-builders";
import { type FormatRowResult, type RowIntensityContext } from "./format-row.types";

export { type ExerciseById } from "./format-percentage-reference";
export {
  type FormatRowResult,
  type RowIntensityContext,
  type RowSummary,
} from "./format-row.types";

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
