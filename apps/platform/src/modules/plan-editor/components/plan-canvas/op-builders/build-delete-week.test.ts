import { describe, expect, it } from "vitest";

import { buildDeleteWeek } from "./build-delete-week";

const VALID_CUID_WEEK = "ckxw5p7gp0000q1mnzv5cuq0a";

describe("buildDeleteWeek — emits delete-week op with version guard", () => {
  it("returns delete-week op with weekId and expectedVersion", () => {
    const op = buildDeleteWeek({ weekId: VALID_CUID_WEEK, expectedVersion: 7 });

    expect(op).toEqual({
      kind: "delete-week",
      weekId: VALID_CUID_WEEK,
      expectedVersion: 7,
    });
  });

  it("preserves expectedVersion of 1 for never-edited weeks", () => {
    const op = buildDeleteWeek({ weekId: VALID_CUID_WEEK, expectedVersion: 1 });

    expect(op).toEqual({
      kind: "delete-week",
      weekId: VALID_CUID_WEEK,
      expectedVersion: 1,
    });
  });
});
