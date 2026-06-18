import { describe, expect, it } from "vitest";

import type { RestSpec } from "@repo/contracts/lms/_shared";

import { formatRestSpec } from "./format-rest-spec";

const makeRest = (overrides: Partial<RestSpec> = {}): RestSpec => ({
  duration: { value: 90, unit: "sec" },
  scope: "between_sets",
  ...overrides,
});

describe("formatRestSpec", () => {
  it("formats sec duration without a space before the s suffix", () => {
    expect(formatRestSpec(makeRest({ duration: { value: 90, unit: "sec" } }))).toBe(
      "rest 90s between sets",
    );
  });

  it("formats min duration with a leading space before 'min'", () => {
    expect(formatRestSpec(makeRest({ duration: { value: 2, unit: "min" } }))).toBe(
      "rest 2 min between sets",
    );
  });

  it("formats range_sec duration as <value>–<rangeMax> s with EN DASH and space before s", () => {
    expect(
      formatRestSpec(
        makeRest({
          duration: { value: 60, unit: "range_sec", rangeMax: 90 },
          scope: "after_specific_set",
          setIndex: 3,
        }),
      ),
    ).toBe("rest 60–90 s after set 3");
  });

  it("formats range_min duration as <value>–<rangeMax> min", () => {
    expect(
      formatRestSpec(
        makeRest({
          duration: { value: 1, unit: "range_min", rangeMax: 2 },
          scope: "between_rounds",
        }),
      ),
    ).toBe("rest 1–2 min between rounds");
  });

  it("renders between_intervals scope suffix verbatim", () => {
    expect(formatRestSpec(makeRest({ scope: "between_intervals" }))).toBe(
      "rest 90s between intervals",
    );
  });

  it("appends the until-recovery suffix when qualifier is until_recovery", () => {
    expect(
      formatRestSpec(
        makeRest({
          duration: { value: 2, unit: "min" },
          scope: "between_rounds",
          qualifier: "until_recovery",
        }),
      ),
    ).toBe("rest 2 min between rounds · until recovery");
  });

  it("omits the until-recovery suffix when qualifier is fixed", () => {
    expect(
      formatRestSpec(
        makeRest({
          duration: { value: 90, unit: "sec" },
          scope: "between_sets",
          qualifier: "fixed",
        }),
      ),
    ).toBe("rest 90s between sets");
  });

  it("omits the until-recovery suffix when qualifier is omitted", () => {
    expect(formatRestSpec(makeRest({ scope: "between_sets" }))).toBe("rest 90s between sets");
  });

  it("falls back to '?' when after_specific_set scope is missing setIndex", () => {
    expect(formatRestSpec(makeRest({ scope: "after_specific_set" }))).toBe("rest 90s after set ?");
  });

  it("treats missing rangeMax as a degenerate single-value range", () => {
    expect(formatRestSpec(makeRest({ duration: { value: 60, unit: "range_sec" } }))).toBe(
      "rest 60–60 s between sets",
    );
  });

  it("returns no scope suffix when scope is pathological (defensive default)", () => {
    const pathological = {
      duration: { value: 30, unit: "sec" },
      scope: "unknown_scope",
    } as unknown as RestSpec;

    const result = formatRestSpec(pathological);

    expect(result).not.toContain("undefined");
    expect(result).toBe("rest 30s");
  });
});
