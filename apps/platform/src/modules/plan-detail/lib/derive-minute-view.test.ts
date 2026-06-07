import { describe, expect, it } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";

import { deriveMinuteView } from "./derive-minute-view";

const cadence = (rounds: number): Composition => ({
  repetition: { kind: "cadence", everyMin: 1, rounds },
});

describe("deriveMinuteView", () => {
  it("returns none for a non-cadence composition", () => {
    const composition: Composition = { repetition: { kind: "count", count: 5 } };

    expect(deriveMinuteView(composition, ["r1", "r2"])).toEqual({ kind: "none" });
  });

  it("returns none for an empty composition", () => {
    expect(deriveMinuteView({}, ["r1"])).toEqual({ kind: "none" });
  });

  it("labels four rows MIN 1 through MIN 4 for a four-round cadence", () => {
    const result = deriveMinuteView(cadence(4), ["r1", "r2", "r3", "r4"]);

    expect(result).toEqual({
      kind: "minutes",
      assignments: [
        { rowId: "r1", minuteLabel: "MIN 1" },
        { rowId: "r2", minuteLabel: "MIN 2" },
        { rowId: "r3", minuteLabel: "MIN 3" },
        { rowId: "r4", minuteLabel: "MIN 4" },
      ],
    });
  });

  it("cycles minute labels when there are more rows than rounds", () => {
    const result = deriveMinuteView(cadence(4), ["a", "b", "c", "d", "e", "f", "g", "h"]);

    expect(result.kind).toBe("minutes");

    if (result.kind === "minutes") {
      expect(result.assignments.map((assignment) => assignment.minuteLabel)).toEqual([
        "MIN 1",
        "MIN 2",
        "MIN 3",
        "MIN 4",
        "MIN 1",
        "MIN 2",
        "MIN 3",
        "MIN 4",
      ]);
    }
  });

  it("returns an empty assignments list for a cadence with no rows", () => {
    expect(deriveMinuteView(cadence(4), [])).toEqual({ kind: "minutes", assignments: [] });
  });

  it("returns none for a non-positive or non-integer rounds (malformed authoring draft)", () => {
    expect(deriveMinuteView(cadence(0), ["r1", "r2"])).toEqual({ kind: "none" });
    expect(deriveMinuteView(cadence(-1), ["r1"])).toEqual({ kind: "none" });
    expect(deriveMinuteView(cadence(2.5), ["r1"])).toEqual({ kind: "none" });
  });
});
