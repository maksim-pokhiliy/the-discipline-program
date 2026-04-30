import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  formatPlanSelection,
  formatSinglePlanSelection,
  parsePlanSelection,
  parseSinglePlanSelection,
  PLAN_SELECTION_URL_CAP,
  planSelectionContains,
  togglePlanSelectionId,
} from "./selection";

const VALID_CUID_A = "ckxw5p7gp0000q1mnzv5cuq0a";
const VALID_CUID_B = "ckxw5p7gp0000q1mnzv5cuq0b";
const VALID_CUID_C = "ckxw5p7gp0000q1mnzv5cuq0c";

describe("parsePlanSelection — legacy single id", () => {
  it("returns null for empty input", () => {
    expect(parsePlanSelection(null)).toBeNull();
    expect(parsePlanSelection("")).toBeNull();
  });

  it("parses legacy single-id form", () => {
    expect(parsePlanSelection(`block:${VALID_CUID_A}`)).toEqual({
      kind: "block",
      ids: [VALID_CUID_A],
    });
  });

  it("returns null for invalid kind", () => {
    expect(parsePlanSelection(`week:${VALID_CUID_A}`)).toBeNull();
  });

  it("returns null for invalid cuid", () => {
    expect(parsePlanSelection("block:not-a-cuid")).toBeNull();
  });

  it("returns null for missing id", () => {
    expect(parsePlanSelection("block:")).toBeNull();
  });

  it("returns null for missing kind", () => {
    expect(parsePlanSelection(`:${VALID_CUID_A}`)).toBeNull();
  });
});

describe("parsePlanSelection — multi id", () => {
  it("parses comma-separated multi-id form", () => {
    const raw = `entry:${VALID_CUID_A},${VALID_CUID_B},${VALID_CUID_C}`;

    expect(parsePlanSelection(raw)).toEqual({
      kind: "entry",
      ids: [VALID_CUID_A, VALID_CUID_B, VALID_CUID_C],
    });
  });

  it("rejects when any id is invalid", () => {
    expect(parsePlanSelection(`entry:${VALID_CUID_A},bad-cuid`)).toBeNull();
  });

  it("dedupes repeated ids", () => {
    expect(parsePlanSelection(`entry:${VALID_CUID_A},${VALID_CUID_A}`)).toEqual({
      kind: "entry",
      ids: [VALID_CUID_A],
    });
  });

  it("ignores trailing or repeated commas", () => {
    expect(parsePlanSelection(`segment:${VALID_CUID_A},,${VALID_CUID_B},`)).toEqual({
      kind: "segment",
      ids: [VALID_CUID_A, VALID_CUID_B],
    });
  });
});

describe("formatPlanSelection — round-trip", () => {
  it("formats single id without commas", () => {
    expect(formatPlanSelection({ kind: "block", ids: [VALID_CUID_A] })).toBe(
      `block:${VALID_CUID_A}`,
    );
  });

  it("formats multi ids with commas", () => {
    expect(formatPlanSelection({ kind: "entry", ids: [VALID_CUID_A, VALID_CUID_B] })).toBe(
      `entry:${VALID_CUID_A},${VALID_CUID_B}`,
    );
  });

  it("returns empty string for empty selection", () => {
    expect(formatPlanSelection({ kind: "block", ids: [] })).toBe("");
  });
});

describe("formatSinglePlanSelection / parseSinglePlanSelection", () => {
  it("returns first id from multi-id selection", () => {
    expect(parseSinglePlanSelection(`entry:${VALID_CUID_A},${VALID_CUID_B}`)).toEqual({
      kind: "entry",
      id: VALID_CUID_A,
    });
  });

  it("returns null for invalid input", () => {
    expect(parseSinglePlanSelection("nope")).toBeNull();
  });

  it("formats single planSelection", () => {
    expect(formatSinglePlanSelection({ kind: "segment", id: VALID_CUID_A })).toBe(
      `segment:${VALID_CUID_A}`,
    );
  });
});

describe("planSelectionContains", () => {
  it("returns false for null selection", () => {
    expect(planSelectionContains(null, "block", VALID_CUID_A)).toBe(false);
  });

  it("returns true when selection contains id at matching kind", () => {
    expect(
      planSelectionContains(
        { kind: "entry", ids: [VALID_CUID_A, VALID_CUID_B] },
        "entry",
        VALID_CUID_B,
      ),
    ).toBe(true);
  });

  it("returns false when id matches but kind differs", () => {
    expect(
      planSelectionContains({ kind: "block", ids: [VALID_CUID_A] }, "entry", VALID_CUID_A),
    ).toBe(false);
  });
});

describe("togglePlanSelectionId", () => {
  it("non-additive click replaces selection with single id", () => {
    expect(
      togglePlanSelectionId(
        { kind: "entry", ids: [VALID_CUID_A, VALID_CUID_B] },
        "block",
        VALID_CUID_C,
        false,
      ),
    ).toEqual({ kind: "block", ids: [VALID_CUID_C] });
  });

  it("additive click toggles existing id off", () => {
    expect(
      togglePlanSelectionId(
        { kind: "entry", ids: [VALID_CUID_A, VALID_CUID_B] },
        "entry",
        VALID_CUID_A,
        true,
      ),
    ).toEqual({ kind: "entry", ids: [VALID_CUID_B] });
  });

  it("additive click adds id when absent", () => {
    expect(
      togglePlanSelectionId({ kind: "entry", ids: [VALID_CUID_A] }, "entry", VALID_CUID_B, true),
    ).toEqual({ kind: "entry", ids: [VALID_CUID_A, VALID_CUID_B] });
  });

  it("additive click clears selection when removing the only id", () => {
    expect(
      togglePlanSelectionId({ kind: "entry", ids: [VALID_CUID_A] }, "entry", VALID_CUID_A, true),
    ).toBeNull();
  });

  it("additive click on different kind replaces selection", () => {
    expect(
      togglePlanSelectionId({ kind: "entry", ids: [VALID_CUID_A] }, "block", VALID_CUID_B, true),
    ).toEqual({ kind: "block", ids: [VALID_CUID_B] });
  });
});

describe("URL length cap + sessionStorage fallback", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
  });

  it("falls back to sessionStorage when ids exceed URL cap", () => {
    const ids = Array.from({ length: PLAN_SELECTION_URL_CAP + 1 }, (_, i) => {
      const suffix = i.toString(36).padStart(2, "0").slice(-2);

      return `ckxw5p7gp0000q1mnzv5cuq${suffix}`;
    });
    const formatted = formatPlanSelection({ kind: "entry", ids });

    expect(formatted.startsWith("session-store:")).toBe(true);

    const parsed = parsePlanSelection(formatted);

    expect(parsed?.kind).toBe("entry");
    expect(parsed?.ids).toEqual(ids);
  });

  it("returns null when sessionStorage key is missing", () => {
    expect(parsePlanSelection("session-store:missing")).toBeNull();
  });

  it("returns null when sessionStorage payload is malformed", () => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem("plan-selection:bad", "{not-json");
    expect(parsePlanSelection("session-store:bad")).toBeNull();
  });
});
