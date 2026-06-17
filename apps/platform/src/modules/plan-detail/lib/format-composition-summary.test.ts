import { describe, expect, it } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";

import { formatCompositionSummary } from "./format-composition-summary";

describe("formatCompositionSummary repetition labels", () => {
  it("labels an exact count as rounds", () => {
    const composition: Composition = { repetition: { kind: "count", count: 5 } };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "5 rounds" }]);
  });

  it("labels a count range as rounds", () => {
    const composition: Composition = { repetition: { kind: "count", count: { min: 3, max: 5 } } };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "3-5 rounds" }]);
  });

  it("labels a ladder with its joined steps", () => {
    const composition: Composition = { repetition: { kind: "ladder", steps: [21, 15, 9] } };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "ladder 21-15-9" }]);
  });

  it("labels a cadence as an EMOM with minute mark and rounds", () => {
    const composition: Composition = {
      repetition: { kind: "cadence", everyMin: 1, rounds: 4 },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "EMOM 1’×4" }]);
  });

  it("labels a timeCap with the minute mark", () => {
    const composition: Composition = {
      repetition: { kind: "timeCap", cap: { min: 5, unit: "min" } },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "cap 5’" }]);
  });

  it("labels a minute interval as count by work over off minutes", () => {
    const composition: Composition = {
      repetition: {
        kind: "interval",
        work: { value: 2, unit: "min" },
        off: { value: 1, unit: "min" },
        count: 3,
      },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "3×2’/1’" }]);
  });

  it("labels a sub-minute Tabata interval with seconds (colon prefix)", () => {
    const composition: Composition = {
      repetition: {
        kind: "interval",
        work: { value: 20, unit: "sec" },
        off: { value: 10, unit: "sec" },
        count: 8,
      },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "8×:20/:10" }]);
  });

  it("omits a once repetition while still rendering it", () => {
    const composition: Composition = { repetition: { kind: "once" } };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "once" }]);
  });
});

describe("formatCompositionSummary rest labels", () => {
  it("renders a range rest with the minute mark", () => {
    const composition: Composition = {
      rest: { duration: { value: 3, unit: "range_min", rangeMax: 5 }, scope: "between_rounds" },
    };

    expect(formatCompositionSummary(composition)).toEqual([
      { text: "rest 3–5 min between rounds" },
    ]);
  });

  it("emits the repetition part before the rest part", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 3 },
      rest: { duration: { value: 60, unit: "sec" }, scope: "between_rounds" },
    };

    expect(formatCompositionSummary(composition)).toEqual([
      { text: "3 rounds" },
      { text: "rest 60s between rounds" },
    ]);
  });

  it("returns an empty list for an empty composition", () => {
    expect(formatCompositionSummary({})).toEqual([]);
  });
});

describe("formatCompositionSummary cap part", () => {
  it("renders a cross-cutting minute cap after the repetition part", () => {
    const composition: Composition = {
      repetition: { kind: "ladder", steps: [21, 15, 9] },
      cap: { min: 12, unit: "min" },
    };

    expect(formatCompositionSummary(composition)).toEqual([
      { text: "ladder 21-15-9" },
      { text: "cap 12’" },
    ]);
  });

  it("renders a sub-minute cap with the seconds mark", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 3 },
      cap: { min: 30, unit: "sec" },
    };

    expect(formatCompositionSummary(composition)).toEqual([
      { text: "3 rounds" },
      { text: "cap 30s" },
    ]);
  });
});
