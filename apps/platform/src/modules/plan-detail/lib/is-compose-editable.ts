import type { SchemaWithBody } from "@repo/contracts/lms/schema";

export const isComposeEditable = (schema: SchemaWithBody): boolean => {
  const composition = schema.schema.composition;

  if (composition?.repetition?.kind === "range") {
    return false;
  }

  return schema.subSchemas.every(isComposeEditable);
};
