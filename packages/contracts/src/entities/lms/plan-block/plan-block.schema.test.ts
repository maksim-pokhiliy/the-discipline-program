import { describe, expect, it } from "vitest";

import { createPlanBlockSchema } from "./plan-block.schema";

const baseValid = {
  sessionId: "ckxabcdefghijklmnopqrst",
  order: 0,
  schemeTypeId: "ckxabcdefghijklmnopqrsu",
  blockTypeIds: ["ckxabcdefghijklmnopqrsv"],
  schemeParams: { kind: "NONE" },
};

describe("createPlanBlockSchema", () => {
  it("rejects duplicate blockTypeIds", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      blockTypeIds: ["ckxabcdefghijklmnopqrsv", "ckxabcdefghijklmnopqrsv"],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("blockTypeIds must be unique");
    }
  });

  it("rejects NUL byte in notes", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      notes: "before\0after",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("must not contain NUL byte");
    }
  });

  it("accepts unique blockTypeIds without NUL", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      blockTypeIds: ["ckxabcdefghijklmnopqrsv", "ckxabcdefghijklmnopqrsw"],
      notes: "warmup couplet",
    });

    expect(result.success).toBe(true);
  });
});
