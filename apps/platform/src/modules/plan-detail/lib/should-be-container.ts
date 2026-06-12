import type { SchemaDraft } from "../components/axes/axis-draft.types";

const MULTI_ROW_THRESHOLD = 1;

export const shouldBeContainer = (schema: SchemaDraft): boolean => {
  const hasRepetitionSemantics =
    schema.repetition !== undefined && schema.repetition.kind !== "once";
  const hasMultipleRows = schema.rows.length > MULTI_ROW_THRESHOLD;

  return hasRepetitionSemantics || hasMultipleRows;
};
