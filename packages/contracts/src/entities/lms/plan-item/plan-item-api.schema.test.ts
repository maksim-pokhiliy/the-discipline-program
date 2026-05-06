import { describe, expect, it } from "vitest";

import { updatePlanItemRequestSchema } from "./plan-item-api.schema";

describe("updatePlanItemRequestSchema", () => {
  it("rejects empty update body", () => {
    const result = updatePlanItemRequestSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("patch cannot be empty");
    }
  });

  it("accepts a patch with order only", () => {
    const result = updatePlanItemRequestSchema.safeParse({ order: 3 });

    expect(result.success).toBe(true);
  });
});
