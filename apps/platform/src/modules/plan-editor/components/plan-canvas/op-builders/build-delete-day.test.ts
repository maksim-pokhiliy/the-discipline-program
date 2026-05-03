import { describe, expect, it } from "vitest";

import { buildDeleteDay } from "./build-delete-day";

const VALID_CUID_DAY = "ckxw5p7gp0000q1mnzv5cuq0a";

describe("buildDeleteDay — emits delete-day op with version guard", () => {
  it("returns delete-day op with dayId and expectedVersion", () => {
    const op = buildDeleteDay({ dayId: VALID_CUID_DAY, expectedVersion: 6 });

    expect(op).toEqual({
      kind: "delete-day",
      dayId: VALID_CUID_DAY,
      expectedVersion: 6,
    });
  });

  it("preserves expectedVersion of 1 for never-edited days", () => {
    const op = buildDeleteDay({ dayId: VALID_CUID_DAY, expectedVersion: 1 });

    expect(op).toEqual({
      kind: "delete-day",
      dayId: VALID_CUID_DAY,
      expectedVersion: 1,
    });
  });
});
