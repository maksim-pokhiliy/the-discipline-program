import { describe, expect, it } from "vitest";

import { buildCreateSession } from "./build-create-session";

const VALID_CUID_DAY = "ckxw5p7gp0000q1mnzv5cuq0a";

describe("buildCreateSession — emits create-session op with optional order", () => {
  it("returns create-session op with empty payload when order, label, notes are omitted", () => {
    const op = buildCreateSession({ dayId: VALID_CUID_DAY });

    expect(op).toEqual({
      kind: "create-session",
      dayId: VALID_CUID_DAY,
      payload: {},
    });
  });

  it("includes explicit order when provided", () => {
    const op = buildCreateSession({ dayId: VALID_CUID_DAY, order: 3 });

    expect(op).toEqual({
      kind: "create-session",
      dayId: VALID_CUID_DAY,
      payload: { order: 3 },
    });
  });

  it("includes label and notes when provided alongside order", () => {
    const op = buildCreateSession({
      dayId: VALID_CUID_DAY,
      order: 0,
      label: "Morning",
      notes: "Activation",
    });

    expect(op).toEqual({
      kind: "create-session",
      dayId: VALID_CUID_DAY,
      payload: { order: 0, label: "Morning", notes: "Activation" },
    });
  });
});
