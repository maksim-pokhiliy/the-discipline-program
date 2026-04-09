import { type JsonObject, type JsonValue } from "@prisma/client/runtime/library";

const isJsonRecord = (val: JsonValue): val is JsonObject =>
  val !== null && typeof val === "object" && !Array.isArray(val);

export const asJsonRecord = (val: JsonValue): JsonObject | null => (isJsonRecord(val) ? val : null);
