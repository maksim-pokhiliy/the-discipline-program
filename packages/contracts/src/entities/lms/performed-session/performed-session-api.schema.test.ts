import { describe, expect, it } from "vitest";

import { createPerformedSessionRequestSchema } from "./performed-session-api.schema";

describe("createPerformedSessionRequestSchema", () => {
  it("coerces string performedAt to Date (HTTP JSON shape)", () => {
    const result = createPerformedSessionRequestSchema.safeParse({
      sessionId: "ckxabcdefghijklmnopqrst",
      performedAt: "2026-01-01",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.performedAt).toBeInstanceOf(Date);
    }
  });

  it("accepts Date instance directly (service-layer shape)", () => {
    const result = createPerformedSessionRequestSchema.safeParse({
      sessionId: "ckxabcdefghijklmnopqrst",
      performedAt: new Date("2026-01-01"),
    });

    expect(result.success).toBe(true);
  });

  it("rejects bogus date string", () => {
    const result = createPerformedSessionRequestSchema.safeParse({
      sessionId: "ckxabcdefghijklmnopqrst",
      performedAt: "not-a-date",
    });

    expect(result.success).toBe(false);
  });
});
