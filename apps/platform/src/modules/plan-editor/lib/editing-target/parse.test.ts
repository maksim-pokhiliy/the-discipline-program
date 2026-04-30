import { describe, expect, it } from "vitest";

import { ALL_TARGET, editingTargetEquals, formatEditingTarget, parseEditingTarget } from "./parse";

const VALID_CUID = "cln1234567890abcdefghijkl";

describe("parseEditingTarget", () => {
  it("returns 'all' when param is missing", () => {
    expect(parseEditingTarget(null)).toEqual(ALL_TARGET);
  });

  it("returns 'all' when param is empty", () => {
    expect(parseEditingTarget("")).toEqual(ALL_TARGET);
  });

  it("returns 'all' for unknown prefix", () => {
    expect(parseEditingTarget(`coach:${VALID_CUID}`)).toEqual(ALL_TARGET);
  });

  it("returns 'all' for malformed cuid", () => {
    expect(parseEditingTarget("athlete:not-a-cuid")).toEqual(ALL_TARGET);
  });

  it("returns 'athlete' for a valid cuid", () => {
    expect(parseEditingTarget(`athlete:${VALID_CUID}`)).toEqual({
      kind: "athlete",
      enrollmentId: VALID_CUID,
    });
  });
});

describe("formatEditingTarget", () => {
  it("returns null for 'all'", () => {
    expect(formatEditingTarget(ALL_TARGET)).toBeNull();
  });

  it("returns 'athlete:CUID' for an athlete target", () => {
    expect(formatEditingTarget({ kind: "athlete", enrollmentId: VALID_CUID })).toBe(
      `athlete:${VALID_CUID}`,
    );
  });
});

describe("editingTargetEquals", () => {
  it("treats two 'all' targets as equal", () => {
    expect(editingTargetEquals(ALL_TARGET, ALL_TARGET)).toBe(true);
  });

  it("treats 'all' and 'athlete' as different", () => {
    expect(editingTargetEquals(ALL_TARGET, { kind: "athlete", enrollmentId: VALID_CUID })).toBe(
      false,
    );
  });

  it("compares 'athlete' targets by enrollmentId", () => {
    const a = { kind: "athlete", enrollmentId: VALID_CUID } as const;
    const b = { kind: "athlete", enrollmentId: "cln1234567890abcdefghijkm" } as const;

    expect(editingTargetEquals(a, a)).toBe(true);
    expect(editingTargetEquals(a, b)).toBe(false);
  });
});
