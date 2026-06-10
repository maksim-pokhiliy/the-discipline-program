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

  it("labels an interval as count by work over off minutes", () => {
    const composition: Composition = {
      repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "3×2’/1’" }]);
  });

  it("omits a once repetition while still rendering it", () => {
    const composition: Composition = { repetition: { kind: "once" } };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "once" }]);
  });
});

describe("formatCompositionSummary arrangement labels", () => {
  it("skips an ordered arrangement", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 3 },
      arrangement: { kind: "ordered" },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "3 rounds" }]);
  });

  it("renders a superset arrangement label", () => {
    const composition: Composition = {
      arrangement: { kind: "superset", pairs: [{ label: "A", rowIds: ["ck1", "ck2"] }] },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "superset" }]);
  });
});

describe("formatCompositionSummary structural parallel", () => {
  it("labels an empty composition with two container children as parallel with the default interleave order", () => {
    expect(formatCompositionSummary({}, { containerChildCount: 2 })).toEqual([
      { text: "parallel (round by round)" },
    ]);
  });

  it("folds a stored track-by-track interleave order into the parallel label", () => {
    const composition: Composition = { interleaveOrder: "track_by_track" };

    expect(formatCompositionSummary(composition, { containerChildCount: 2 })).toEqual([
      { text: "parallel (track by track)" },
    ]);
  });

  it("emits the parallel part before the rest part", () => {
    const composition: Composition = {
      rest: { duration: { value: 60, unit: "sec" }, scope: "between_rounds" },
    };

    expect(formatCompositionSummary(composition, { containerChildCount: 2 })).toEqual([
      { text: "parallel (round by round)" },
      { text: "rest 60 sec" },
    ]);
  });

  it("does not label a single-child parent as parallel", () => {
    expect(formatCompositionSummary({}, { containerChildCount: 1 })).toEqual([]);
  });

  it("does not label a cadence parent with children as parallel", () => {
    const composition: Composition = { repetition: { kind: "cadence", everyMin: 1, rounds: 12 } };

    expect(formatCompositionSummary(composition, { containerChildCount: 3 })).toEqual([
      { text: "EMOM 1’×12" },
    ]);
  });

  it("lets an explicit superset arrangement win over structure", () => {
    const composition: Composition = {
      arrangement: { kind: "superset", pairs: [{ label: "A", rowIds: ["ck1", "ck2"] }] },
    };

    expect(formatCompositionSummary(composition, { containerChildCount: 2 })).toEqual([
      { text: "superset" },
    ]);
  });

  it("ignores a stranded interleave order when the structure is not parallel", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 3 },
      interleaveOrder: "track_by_track",
    };

    expect(formatCompositionSummary(composition, { containerChildCount: 1 })).toEqual([
      { text: "3 rounds" },
    ]);
  });
});

describe("formatCompositionSummary rest labels", () => {
  it("renders a range rest with the minute mark", () => {
    const composition: Composition = {
      rest: { duration: { value: 3, unit: "range_min", rangeMax: 5 }, scope: "between_rounds" },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "rest 3–5’" }]);
  });

  it("returns an empty list for an empty composition", () => {
    expect(formatCompositionSummary({})).toEqual([]);
  });
});
