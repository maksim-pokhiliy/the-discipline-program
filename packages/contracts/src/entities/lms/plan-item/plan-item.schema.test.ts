import { describe, expect, it } from "vitest";

import { createPlanItemSchema } from "./plan-item.schema";

const baseValid = {
  blockId: "ckxabcdefghijklmnopqrst",
  order: 0,
  exerciseId: "ckxabcdefghijklmnopqrsu",
  prescription: {
    reps: { kind: "FIXED" as const, value: 5 },
    sideMode: "BILATERAL" as const,
    modifiers: [],
  },
};

describe("createPlanItemSchema", () => {
  it("rejects duplicate alternative exerciseIds", () => {
    const result = createPlanItemSchema.safeParse({
      ...baseValid,
      alternatives: [
        { exerciseId: "ckxabcdefghijklmnopqrsv" },
        { exerciseId: "ckxabcdefghijklmnopqrsv" },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("alternatives must have unique");
    }
  });

  it("rejects primary as alternative", () => {
    const result = createPlanItemSchema.safeParse({
      ...baseValid,
      exerciseId: "ckxabcdefghijklmnopqrsu",
      alternatives: [{ exerciseId: "ckxabcdefghijklmnopqrsu" }],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("must not include the primary");
    }
  });

  it("rejects NUL byte in notes", () => {
    const result = createPlanItemSchema.safeParse({
      ...baseValid,
      notes: "before\0after",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("must not contain NUL byte");
    }
  });

  it("accepts unique alternatives that exclude primary", () => {
    const result = createPlanItemSchema.safeParse({
      ...baseValid,
      alternatives: [
        { exerciseId: "ckxabcdefghijklmnopqrsv" },
        { exerciseId: "ckxabcdefghijklmnopqrsw" },
      ],
    });

    expect(result.success).toBe(true);
  });
});
