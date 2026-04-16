import { describe, expect, it } from "vitest";

import { reconcileResponseSchema } from "./coach-action-item-api.schema";

describe("coach-action-item-api schema empty payloads", () => {
  it("reconcileResponseSchema accepts all zero counts", () => {
    const result = reconcileResponseSchema.safeParse({
      created: 0,
      updated: 0,
      resolved: 0,
    });

    expect(result.success).toBe(true);
  });

  it("reconcileResponseSchema rejects missing keys", () => {
    const result = reconcileResponseSchema.safeParse({ created: 0 });

    expect(result.success).toBe(false);
  });

  it("reconcileResponseSchema rejects non-integer counts", () => {
    const result = reconcileResponseSchema.safeParse({
      created: 1.5,
      updated: 0,
      resolved: 0,
    });

    expect(result.success).toBe(false);
  });

  it("reconcileResponseSchema rejects null", () => {
    const result = reconcileResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });
});
