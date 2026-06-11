import { type SchemaWithBody } from "@repo/contracts/lms/schema";

import { formatStructuralSummary } from "./format-composition-summary";

export const formatSchemaHeader = (schema: SchemaWithBody): string => {
  const header = schema.schema.header;

  if (header !== null && header !== "") {
    return header;
  }

  const composition = schema.schema.composition;

  if (composition === null) {
    return "";
  }

  const [structuralPart] = formatStructuralSummary(composition);

  return structuralPart ?? "";
};
