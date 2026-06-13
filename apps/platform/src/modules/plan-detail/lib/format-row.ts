import { type SchemaRow } from "@repo/contracts/lms/schema-row";

import { type ExerciseById } from "./format-percentage-reference";
import { buildRow } from "./format-row-builders";
import { type FormatRowResult } from "./format-row.types";

export { type ExerciseById } from "./format-percentage-reference";
export { type FormatRowResult } from "./format-row.types";

const NOTE_QUOTE = "'";

const formatNote = (note: string): string => `${NOTE_QUOTE}${note}${NOTE_QUOTE}`;

export const formatRow = (
  row: SchemaRow,
  exerciseById: ExerciseById,
  index: number,
): FormatRowResult => {
  const built = buildRow(row, exerciseById, index);
  const base = row.media === null ? built : { ...built, demoUrl: row.media.url };

  if (row.notes === null || row.notes.length === 0) {
    return base;
  }

  return {
    ...base,
    subParts: [...base.subParts, ...row.notes.map(formatNote)],
  };
};
