import { describe, expect, it } from "vitest";

import { createPlanSessionSchema } from "./plan-session.schema";

describe("createPlanSessionSchema", () => {
  it("rejects NUL byte in label", () => {
    const result = createPlanSessionSchema.safeParse({
      dayId: "ckxabcdefghijklmnopqrst",
      order: 0,
      label: "warm\0up",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("must not contain NUL byte");
    }
  });

  it("accepts a clean label", () => {
    const result = createPlanSessionSchema.safeParse({
      dayId: "ckxabcdefghijklmnopqrst",
      order: 0,
      label: "warmup",
    });

    expect(result.success).toBe(true);
  });
});
