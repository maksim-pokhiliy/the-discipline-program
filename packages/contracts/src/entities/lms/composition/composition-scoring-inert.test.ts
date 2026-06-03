import { describe, expect, it } from "vitest";

import type { ScoringDirective } from "./composition.types";

const SCORING_VARIANTS: ScoringDirective[] = [
  { kind: "prescribed" },
  { kind: "amrap" },
  { kind: "amrap", condition: { appliesToRounds: [2, 3] } },
  { kind: "for_time" },
  { kind: "for_time", condition: { appliesToRounds: [2, 3] } },
  { kind: "max_in_remaining" },
  { kind: "max_in_remaining", condition: { appliesToRounds: [2, 3] } },
  { kind: "total" },
  { kind: "total", condition: { appliesToRounds: [2, 3] } },
  { kind: "progressive", seed: "3-3-3-2-2-1" },
  { kind: "progressive", seed: "3-3-3-2-2-1", condition: { appliesToRounds: [2, 3] } },
];

const isFunctionFree = (value: unknown): boolean => {
  if (typeof value === "function") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.every(isFunctionFree);
  }

  if (value !== null && typeof value === "object") {
    return Object.values(value).every(isFunctionFree);
  }

  return true;
};

describe("ScoringDirective is a pure data descriptor (§6 inert mandate)", () => {
  it("carries no function-valued member on any variant, including the nested condition", () => {
    for (const variant of SCORING_VARIANTS) {
      expect(isFunctionFree(variant)).toBe(true);
    }
  });

  it("models the scoring condition as plain round-index data, never an evaluator", () => {
    for (const variant of SCORING_VARIANTS) {
      if ("condition" in variant && variant.condition !== undefined) {
        expect(Array.isArray(variant.condition.appliesToRounds)).toBe(true);
        expect(variant.condition.appliesToRounds.every((round) => typeof round === "number")).toBe(
          true,
        );
      }
    }
  });
});
