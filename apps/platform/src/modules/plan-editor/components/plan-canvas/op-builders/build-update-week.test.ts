import { describe, expect, it } from "vitest";

import { buildUpdateWeek } from "./build-update-week";

const VALID_CUID_WEEK = "ckxw5p7gp0000q1mnzv5cuq0a";

describe("buildUpdateWeek — emits update-week op with version guard", () => {
  it("returns update-week op with empty fullEntity when no patch fields are provided", () => {
    const op = buildUpdateWeek({ weekId: VALID_CUID_WEEK, expectedVersion: 3 });

    expect(op).toEqual({
      kind: "update-week",
      weekId: VALID_CUID_WEEK,
      expectedVersion: 3,
      fullEntity: {},
    });
  });

  it("includes label and notes patches including null clears", () => {
    const op = buildUpdateWeek({
      weekId: VALID_CUID_WEEK,
      expectedVersion: 5,
      label: "Strength",
      notes: null,
    });

    expect(op).toEqual({
      kind: "update-week",
      weekId: VALID_CUID_WEEK,
      expectedVersion: 5,
      fullEntity: { label: "Strength", notes: null },
    });
  });

  it("supports reindex with simultaneous label change", () => {
    const op = buildUpdateWeek({
      weekId: VALID_CUID_WEEK,
      expectedVersion: 1,
      index: 4,
      label: "Peak",
    });

    expect(op).toEqual({
      kind: "update-week",
      weekId: VALID_CUID_WEEK,
      expectedVersion: 1,
      fullEntity: { index: 4, label: "Peak" },
    });
  });
});
