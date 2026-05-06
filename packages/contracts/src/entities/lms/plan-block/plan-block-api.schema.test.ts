import { describe, expect, it } from "vitest";

import { updatePlanBlockRequestSchema } from "./plan-block-api.schema";

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
});
