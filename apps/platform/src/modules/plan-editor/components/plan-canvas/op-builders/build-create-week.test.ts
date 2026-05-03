import { describe, expect, it } from "vitest";

import { buildCreateWeek } from "./build-create-week";

const VALID_CUID_PLAN = "ckxw5p7gp0000q1mnzv5cuq0a";

describe("buildCreateWeek — emits create-week op with payload", () => {
  it("returns create-week op with index only when label and notes are omitted", () => {
    const op = buildCreateWeek({ planId: VALID_CUID_PLAN, index: 0 });

    expect(op).toEqual({
      kind: "create-week",
      planId: VALID_CUID_PLAN,
      payload: { index: 0 },
    });
  });

  it("includes label and notes when provided", () => {
    const op = buildCreateWeek({
      planId: VALID_CUID_PLAN,
      index: 2,
      label: "Hypertrophy",
      notes: "Volume bias",
    });

    expect(op).toEqual({
      kind: "create-week",
      planId: VALID_CUID_PLAN,
      payload: { index: 2, label: "Hypertrophy", notes: "Volume bias" },
    });
  });

  it("omits label when undefined but keeps notes when present", () => {
    const op = buildCreateWeek({ planId: VALID_CUID_PLAN, index: 1, notes: "Deload" });

    expect(op).toEqual({
      kind: "create-week",
      planId: VALID_CUID_PLAN,
      payload: { index: 1, notes: "Deload" },
    });
  });
});
