import { describe, expect, it } from "vitest";

import type { RepetitionAxis } from "../components/axes/axis-draft.types";
import { REPETITION_DEFAULTS } from "../components/axes/repetition-defaults";

import { isRepetitionDirty, repetitionEquals } from "./is-repetition-dirty";

describe("isRepetitionDirty", () => {
  it("returns false for a pristine once axis", () => {
    expect(isRepetitionDirty(REPETITION_DEFAULTS.once)).toBe(false);
  });

  it("returns false for a pristine count axis", () => {
    expect(isRepetitionDirty(REPETITION_DEFAULTS.count)).toBe(false);
  });

  it("returns false for a pristine ladder axis", () => {
    expect(isRepetitionDirty(REPETITION_DEFAULTS.ladder)).toBe(false);
  });

  it("returns false for a pristine timeCap axis", () => {
    expect(isRepetitionDirty(REPETITION_DEFAULTS.timeCap)).toBe(false);
  });

  it("returns false for a pristine cadence axis", () => {
    expect(isRepetitionDirty(REPETITION_DEFAULTS.cadence)).toBe(false);
  });

  it("returns false for a pristine interval axis", () => {
    expect(isRepetitionDirty(REPETITION_DEFAULTS.interval)).toBe(false);
  });

  it("returns true for an edited ladder", () => {
    const edited: RepetitionAxis = { kind: "ladder", steps: [20, 15, 9] };

    expect(isRepetitionDirty(edited)).toBe(true);
  });

  it("returns true for a ladder with a different step count", () => {
    const edited: RepetitionAxis = { kind: "ladder", steps: [21, 15] };

    expect(isRepetitionDirty(edited)).toBe(true);
  });

  it("returns true for an edited count", () => {
    const edited: RepetitionAxis = { kind: "count", count: 5 };

    expect(isRepetitionDirty(edited)).toBe(true);
  });

  it("returns true for a count switched to a range", () => {
    const edited: RepetitionAxis = { kind: "count", count: { min: 3, max: 5 } };

    expect(isRepetitionDirty(edited)).toBe(true);
  });

  it("returns true for an edited timeCap", () => {
    const edited: RepetitionAxis = { kind: "timeCap", cap: { min: 20, unit: "min" } };

    expect(isRepetitionDirty(edited)).toBe(true);
  });

  it("returns true for a timeCap with an added max", () => {
    const edited: RepetitionAxis = { kind: "timeCap", cap: { min: 12, max: 18, unit: "min" } };

    expect(isRepetitionDirty(edited)).toBe(true);
  });

  it("returns true for an edited cadence", () => {
    const edited: RepetitionAxis = { kind: "cadence", everyMin: 2, rounds: 4 };

    expect(isRepetitionDirty(edited)).toBe(true);
  });

  it("returns true for an edited interval", () => {
    const edited: RepetitionAxis = {
      kind: "interval",
      work: { value: 3, unit: "min" },
      off: { value: 1, unit: "min" },
      count: 3,
    };

    expect(isRepetitionDirty(edited)).toBe(true);
  });
});

describe("repetitionEquals", () => {
  it("returns false when kinds differ", () => {
    expect(repetitionEquals({ kind: "once" }, { kind: "count", count: 3 })).toBe(false);
  });

  it("returns true for two identical ladders", () => {
    expect(
      repetitionEquals(
        { kind: "ladder", steps: [21, 15, 9] },
        { kind: "ladder", steps: [21, 15, 9] },
      ),
    ).toBe(true);
  });

  it("returns true for two equal exact counts", () => {
    expect(repetitionEquals({ kind: "count", count: 4 }, { kind: "count", count: 4 })).toBe(true);
  });

  it("returns true for two equal count ranges", () => {
    expect(
      repetitionEquals(
        { kind: "count", count: { min: 2, max: 4 } },
        { kind: "count", count: { min: 2, max: 4 } },
      ),
    ).toBe(true);
  });

  it("returns false when one count is exact and the other is a range", () => {
    expect(
      repetitionEquals({ kind: "count", count: 4 }, { kind: "count", count: { min: 4, max: 4 } }),
    ).toBe(false);
  });

  it("returns true for two identical intervals (deep value/unit compare)", () => {
    expect(
      repetitionEquals(
        {
          kind: "interval",
          work: { value: 20, unit: "sec" },
          off: { value: 10, unit: "sec" },
          count: 8,
        },
        {
          kind: "interval",
          work: { value: 20, unit: "sec" },
          off: { value: 10, unit: "sec" },
          count: 8,
        },
      ),
    ).toBe(true);
  });

  it("returns false when an interval work value differs", () => {
    expect(
      repetitionEquals(
        {
          kind: "interval",
          work: { value: 20, unit: "sec" },
          off: { value: 10, unit: "sec" },
          count: 8,
        },
        {
          kind: "interval",
          work: { value: 30, unit: "sec" },
          off: { value: 10, unit: "sec" },
          count: 8,
        },
      ),
    ).toBe(false);
  });

  it("returns false when an interval work unit differs (sec vs min)", () => {
    expect(
      repetitionEquals(
        {
          kind: "interval",
          work: { value: 1, unit: "min" },
          off: { value: 1, unit: "min" },
          count: 8,
        },
        {
          kind: "interval",
          work: { value: 1, unit: "sec" },
          off: { value: 1, unit: "min" },
          count: 8,
        },
      ),
    ).toBe(false);
  });
});
