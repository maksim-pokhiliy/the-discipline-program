import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { ComposeContainer, ScoringDirective } from "../compose-tree.types";

import { buildAxesSummary } from "./axes-summary";
import { asNodeId } from "./id-factory";

const SCORING_VARIANTS: ScoringDirective[] = [
  { kind: "prescribed" },
  { kind: "amrap" },
  { kind: "for_time" },
  { kind: "max_in_remaining" },
  { kind: "total" },
  { kind: "progressive", seed: "3-3-3-2-2-1" },
];

const SCORING_LABELS: Record<ScoringDirective["kind"], string> = {
  prescribed: "prescribed",
  amrap: "AMRAP",
  for_time: "for time",
  max_in_remaining: "max-in-remaining",
  total: "total",
  progressive: "progressive",
};

const NUMERIC_PATTERN = /\d/;

const EXECUTION_SYMBOL_PATTERNS = [/\bcomputeScore\b/, /\bevaluateScoring\b/, /\bscore\s*\(/];

const COMPOSE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const containerWithScoring = (scoring: ScoringDirective): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("scored-container"),
  header: null,
  notes: null,
  scoring,
  children: [],
});

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

describe("ScoringDirective is a pure data descriptor (QA-13, design DoD-5 / §6 inert mandate)", () => {
  it("constructs every variant with no function-valued members", () => {
    for (const variant of SCORING_VARIANTS) {
      for (const key of Object.keys(variant)) {
        expect(typeof (variant as Record<string, unknown>)[key]).not.toBe("function");
      }
    }
  });

  it("renders each scoring variant as a pure label, never a computed number", () => {
    for (const variant of SCORING_VARIANTS) {
      const parts = buildAxesSummary(containerWithScoring(variant));

      expect(parts).toContain(SCORING_LABELS[variant.kind]);
      expect(parts.some((part) => NUMERIC_PATTERN.test(part))).toBe(false);
    }
  });
});

describe("no compose module defines or calls a score-execution symbol (QA-13 source scan)", () => {
  it("finds zero computeScore / evaluateScoring / score( occurrences across compose/", () => {
    const sourceFiles = collectSourceFiles(COMPOSE_ROOT);

    expect(sourceFiles.length).toBeGreaterThan(0);

    const offenders = sourceFiles.filter((file) => {
      const contents = readFileSync(file, "utf8");

      return EXECUTION_SYMBOL_PATTERNS.some((pattern) => pattern.test(contents));
    });

    expect(offenders).toStrictEqual([]);
  });
});
