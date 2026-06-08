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

  it("labels the dedicated range kind as rounds", () => {
    const composition: Composition = { repetition: { kind: "range", range: { min: 2, max: 4 } } };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "2-4 rounds" }]);
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

  it("labels a window with its start and end times", () => {
    const composition: Composition = {
      repetition: { kind: "window", startHhMm: "09:00", endHhMm: "10:30" },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "09:00–10:30" }]);
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

  it("folds the round-by-round interleave order into the parallel label", () => {
    const composition: Composition = {
      arrangement: {
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [{ childSchemaId: "ck1" }, { childSchemaId: "ck2" }],
      },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "parallel (round by round)" }]);
  });

  it("folds the track-by-track interleave order into the parallel label", () => {
    const composition: Composition = {
      arrangement: {
        kind: "parallel",
        interleaveOrder: "track_by_track",
        tracks: [{ childSchemaId: "ck1" }, { childSchemaId: "ck2" }],
      },
    };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "parallel (track by track)" }]);
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

describe("formatCompositionSummary programKind badge", () => {
  it("renders the program kind after the structural axes", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 5 },
      programKind: "cluster",
    };

    expect(formatCompositionSummary(composition)).toEqual([
      { text: "5 rounds" },
      { text: "cluster" },
    ]);
  });

  it("appends the program kind last across multiple structural axes", () => {
    const composition: Composition = {
      repetition: { kind: "count", count: 5 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
      programKind: "cluster",
    };

    expect(formatCompositionSummary(composition)).toEqual([
      { text: "5 rounds" },
      { text: "rest 90 sec" },
      { text: "cluster" },
    ]);
  });

  it("renders a bare program kind when no other axis is present", () => {
    const composition: Composition = { programKind: "wave" };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "wave" }]);
  });

  it("maps drop_set to its spaced label", () => {
    const composition: Composition = { programKind: "drop_set" };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "drop set" }]);
  });

  it("omits the program kind label when it is absent", () => {
    const composition: Composition = { repetition: { kind: "count", count: 5 } };

    expect(formatCompositionSummary(composition)).toEqual([{ text: "5 rounds" }]);
  });
});
