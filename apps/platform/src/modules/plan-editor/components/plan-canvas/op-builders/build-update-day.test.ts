import { describe, expect, it } from "vitest";

import { buildUpdateDay } from "./build-update-day";

const VALID_CUID_DAY = "ckxw5p7gp0000q1mnzv5cuq0a";

describe("buildUpdateDay — emits update-day op with version guard", () => {
  it("returns update-day op with empty fullEntity when no patch fields are provided", () => {
    const op = buildUpdateDay({ dayId: VALID_CUID_DAY, expectedVersion: 2 });

    expect(op).toEqual({
      kind: "update-day",
      dayId: VALID_CUID_DAY,
      expectedVersion: 2,
      fullEntity: {},
    });
  });

  it("includes kind change", () => {
    const op = buildUpdateDay({ dayId: VALID_CUID_DAY, expectedVersion: 4, kind: "REST" });

    expect(op).toEqual({
      kind: "update-day",
      dayId: VALID_CUID_DAY,
      expectedVersion: 4,
      fullEntity: { kind: "REST" },
    });
  });

  it("supports clearing notes via null", () => {
    const op = buildUpdateDay({ dayId: VALID_CUID_DAY, expectedVersion: 1, notes: null });

    expect(op).toEqual({
      kind: "update-day",
      dayId: VALID_CUID_DAY,
      expectedVersion: 1,
      fullEntity: { notes: null },
    });
  });
});
