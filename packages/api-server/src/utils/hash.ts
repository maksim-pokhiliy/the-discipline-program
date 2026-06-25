import crypto from "node:crypto";

export const sha256Hex = (input: string): string =>
  crypto.createHash("sha256").update(input).digest("hex");

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isJsonOmitted = (value: unknown): boolean =>
  value === undefined || typeof value === "function" || typeof value === "symbol";

export const stableStringify = (value: unknown): string => {
  if (isJsonOmitted(value)) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .flatMap((key) =>
        isJsonOmitted(value[key]) ? [] : [`${JSON.stringify(key)}:${stableStringify(value[key])}`],
      );

    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
};

export const contentHash = (value: unknown): string => sha256Hex(stableStringify(value));
