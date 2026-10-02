import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const GUARDED_SOURCES = [
  "publish.ts",
  "publish-day.ts",
  "links.ts",
  "athletes.ts",
  "training-levels.ts",
] as const;

const IMPORT_STATEMENT = /import\s+(type\s+)?([^;]*?)\s+from\s+"([^"]+)";/gs;

type ImportStatement = { isTypeOnly: boolean; specifiers: string; source: string };

const readImports = (fileName: string): ImportStatement[] =>
  [...readFileSync(join(__dirname, fileName), "utf8").matchAll(IMPORT_STATEMENT)].map((match) => ({
    isTypeOnly: match[1] !== undefined,
    specifiers: match[2] ?? "",
    source: match[3] ?? "",
  }));

const importsOnlyTypes = (statement: ImportStatement): boolean =>
  statement.isTypeOnly ||
  statement.specifiers
    .replace(/[{}]/g, "")
    .split(",")
    .map((specifier) => specifier.trim())
    .filter((specifier) => specifier !== "")
    .every((specifier) => specifier.startsWith("type "));

describe("the publish path stays free of the legacy session", () => {
  it.each(GUARDED_SOURCES)("%s imports only types from infrastructure/legacy-mobile", (file) => {
    const legacyImports = readImports(file).filter((statement) =>
      statement.source.includes("infrastructure/legacy-mobile"),
    );

    expect(legacyImports.every(importsOnlyTypes)).toBe(true);
  });

  it.each(GUARDED_SOURCES)("%s imports nothing from the token cipher", (file) => {
    const cipherImports = readImports(file).filter(
      (statement) =>
        statement.source.includes("legacy-token-cipher") ||
        statement.source.includes("token-cipher"),
    );

    expect(cipherImports).toEqual([]);
  });

  it("recognises a value import from the legacy client as a violation", () => {
    expect(
      importsOnlyTypes({
        isTypeOnly: false,
        specifiers: "{ type LegacyDailyProgram, defaultLegacyMobileClient }",
        source: "../../../infrastructure/legacy-mobile",
      }),
    ).toBe(false);
  });
});
