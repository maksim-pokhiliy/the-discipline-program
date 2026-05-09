import { describe, expect, it } from "vitest";

import {
  createPlanBlockRequestSchema,
  updatePlanBlockRequestSchema,
} from "./plan-block-api.schema";

const validCreateBody = {
  order: 0,
  schemeTypeId: "ckxabcdefghijklmnopqrsu",
  blockTypeIds: ["ckxabcdefghijklmnopqrsv"],
  schemeParams: { kind: "NONE" as const },
};

const validItem = {
  order: 0,
  exerciseId: "ckxabcdefghijklmnopqrsx",
  prescription: {
    reps: { kind: "FIXED" as const, value: 5 },
    sideMode: "BILATERAL" as const,
    modifiers: [],
  },
};

describe("createPlanBlockRequestSchema", () => {
  it("accepts a body without items", () => {
    const result = createPlanBlockRequestSchema.safeParse(validCreateBody);

    expect(result.success).toBe(true);
  });

  it("accepts a body with items", () => {
    const result = createPlanBlockRequestSchema.safeParse({
      ...validCreateBody,
      items: [validItem],
    });

    expect(result.success).toBe(true);
  });

  it("strips sessionId from the body (request schema omits it)", () => {
    const result = createPlanBlockRequestSchema.safeParse({
      ...validCreateBody,
      sessionId: "ckxabcdefghijklmnopqrst",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(Object.prototype.hasOwnProperty.call(result.data, "sessionId")).toBe(false);
    }
  });
});

describe("updatePlanBlockRequestSchema", () => {
  it("rejects empty update body", () => {
    const result = updatePlanBlockRequestSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("patch cannot be empty");
    }
  });

  it("accepts a patch with notes only", () => {
    const result = updatePlanBlockRequestSchema.safeParse({ notes: "warmup" });

    expect(result.success).toBe(true);
  });

  it("accepts a patch with items only (non-empty refine satisfied)", () => {
    const result = updatePlanBlockRequestSchema.safeParse({ items: [validItem] });

    expect(result.success).toBe(true);
  });

  it("accepts a patch with empty items array (still a non-empty patch key)", () => {
    const result = updatePlanBlockRequestSchema.safeParse({ items: [] });

    expect(result.success).toBe(true);
  });
});
