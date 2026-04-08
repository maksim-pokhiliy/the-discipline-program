import { type JsonValue } from "@prisma/client/runtime/library";

export const asJsonRecord = (val: JsonValue): Record<string, unknown> | null => {
  if (val === null || val === undefined) {
    return null;
  }

  if (typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }

  return null;
};
