import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const EXECUTION_SYMBOL_PATTERNS = [/\bcomputeScore\b/, /\bevaluateScoring\b/, /\bscore\s*\(/];

const TEST_DIR = dirname(fileURLToPath(import.meta.url));

const SCAN_ROOTS = [
  join(TEST_DIR, "..", "mappers", "lms"),
  join(TEST_DIR, "..", "endpoints", "lms", "schema"),
];

type Offender = { file: string; pattern: string };

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);

  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry);

    if (statSync(fullPath).isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    const isSource = fullPath.endsWith(".ts") || fullPath.endsWith(".tsx");
    const isTest = fullPath.endsWith(".test.ts") || fullPath.endsWith(".test.tsx");

    return isSource && !isTest ? [fullPath] : [];
  });
};

describe("no api-server scoring consumer defines or calls a score-execution symbol (DEC-5, §6 inert mandate)", () => {
  it("resolves every scan root to an existing directory", () => {
    for (const root of SCAN_ROOTS) {
      expect(statSync(root).isDirectory()).toBe(true);
    }
  });

  it("finds zero computeScore / evaluateScoring / score( occurrences across the scoring-axis consumer surface", () => {
    const sourceFiles = SCAN_ROOTS.flatMap(collectSourceFiles);

    expect(sourceFiles.length).toBeGreaterThan(0);

    const offenders = sourceFiles.flatMap((file): Offender[] => {
      const contents = readFileSync(file, "utf8");

      return EXECUTION_SYMBOL_PATTERNS.filter((pattern) => pattern.test(contents)).map(
        (pattern) => ({ file, pattern: pattern.source }),
      );
    });

    expect(offenders).toStrictEqual([]);
  });
});
