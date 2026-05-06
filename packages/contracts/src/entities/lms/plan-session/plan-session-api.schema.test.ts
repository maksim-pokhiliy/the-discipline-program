import { describe, expect, it } from "vitest";

import { updatePlanSessionRequestSchema } from "./plan-session-api.schema";

describe("updatePlanSessionRequestSchema", () => {
  it("rejects empty update body", () => {
    const result = updatePlanSessionRequestSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("patch cannot be empty");
    }
  });

  it("accepts a patch with order only", () => {
    const result = updatePlanSessionRequestSchema.safeParse({ order: 2 });

    expect(result.success).toBe(true);
  });
});
