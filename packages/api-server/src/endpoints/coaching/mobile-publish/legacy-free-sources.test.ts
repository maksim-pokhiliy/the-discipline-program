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

const LEGACY_CLIENT_MODULE = "infrastructure/legacy-mobile";
const TOKEN_CIPHER_MODULE = "token-cipher";

const STATIC_IMPORT = /\bimport\s+(type\s+)?([^;]*?)\s+from\s+["']([^"']+)["']/gs;
const RE_EXPORT = /\bexport\s+(type\s+)?([^;]*?)\s+from\s+["']([^"']+)["']/gs;
const SIDE_EFFECT_IMPORT = /\bimport\s+["']([^"']+)["']/g;
const DYNAMIC_IMPORT = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

type ModuleReference = { isTypeOnly: boolean; specifiers: string; source: string };

const namedReferences = (code: string, pattern: RegExp): ModuleReference[] =>
  [...code.matchAll(pattern)].map((match) => ({
    isTypeOnly: match[1] !== undefined,
    specifiers: match[2] ?? "",
    source: match[3] ?? "",
  }));

const valueReferences = (code: string, pattern: RegExp): ModuleReference[] =>
  [...code.matchAll(pattern)].map((match) => ({
    isTypeOnly: false,
    specifiers: "",
    source: match[1] ?? "",
  }));

const readModuleReferences = (code: string): ModuleReference[] => [
  ...namedReferences(code, STATIC_IMPORT),
  ...namedReferences(code, RE_EXPORT),
  ...valueReferences(code, SIDE_EFFECT_IMPORT),
  ...valueReferences(code, DYNAMIC_IMPORT),
];

const readSource = (fileName: string): string => readFileSync(join(__dirname, fileName), "utf8");

const referencesOnlyTypes = (reference: ModuleReference): boolean =>
  reference.isTypeOnly ||
  (reference.specifiers !== "" &&
    reference.specifiers
      .replace(/[{}]/g, "")
      .split(",")
      .map((specifier) => specifier.trim())
      .filter((specifier) => specifier !== "")
      .every((specifier) => specifier.startsWith("type ")));

const referencesTo = (code: string, module: string): ModuleReference[] =>
  readModuleReferences(code).filter((reference) => reference.source.includes(module));

describe("the publish path stays free of the legacy session", () => {
  it.each(GUARDED_SOURCES)("%s imports only types from infrastructure/legacy-mobile", (file) => {
    expect(referencesTo(readSource(file), LEGACY_CLIENT_MODULE).every(referencesOnlyTypes)).toBe(
      true,
    );
  });

  it.each(GUARDED_SOURCES)("%s imports nothing from the token cipher", (file) => {
    expect(referencesTo(readSource(file), TOKEN_CIPHER_MODULE)).toEqual([]);
  });

  it("recognises a value import from the legacy client as a violation", () => {
    const code = `import { type LegacyDailyProgram, defaultLegacyMobileClient } from "../../../infrastructure/legacy-mobile";`;

    expect(referencesTo(code, LEGACY_CLIENT_MODULE).every(referencesOnlyTypes)).toBe(false);
  });

  it.each([
    ["a side-effect import", `import "./legacy-token-cipher";`],
    ["a re-export", `export { decryptLegacyToken } from "./legacy-token-cipher";`],
    ["a dynamic import", `const cipher = await import("./legacy-token-cipher");`],
    ["a single-quoted import", `import { decryptLegacyToken } from './legacy-token-cipher';`],
  ])("catches %s of the token cipher", (_label, code) => {
    expect(referencesTo(code, TOKEN_CIPHER_MODULE)).not.toEqual([]);
  });

  it("treats a type-only re-export from the legacy client as allowed", () => {
    const code = `export type { LegacyDailyProgram } from "../../../infrastructure/legacy-mobile";`;

    expect(referencesTo(code, LEGACY_CLIENT_MODULE).every(referencesOnlyTypes)).toBe(true);
  });
});
