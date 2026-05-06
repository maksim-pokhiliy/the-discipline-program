import { describe, expect, it } from "vitest";

import { createPlanEnrollmentRequestSchema } from "./plan-enrollment-api.schema";

describe("createPlanEnrollmentRequestSchema", () => {
  it("coerces string boardedAt to Date (HTTP JSON shape)", () => {
    const result = createPlanEnrollmentRequestSchema.safeParse({
      athleteId: "ckxabcdefghijklmnopqrst",
      boardedAt: "2026-01-01",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.boardedAt).toBeInstanceOf(Date);
    }
  });

  it("accepts Date instance directly (service-layer shape)", () => {
    const result = createPlanEnrollmentRequestSchema.safeParse({
      athleteId: "ckxabcdefghijklmnopqrst",
      boardedAt: new Date("2026-01-01"),
    });

    expect(result.success).toBe(true);
  });

  it("rejects bogus date string", () => {
    const result = createPlanEnrollmentRequestSchema.safeParse({
      athleteId: "ckxabcdefghijklmnopqrst",
      boardedAt: "not-a-date",
    });

    expect(result.success).toBe(false);
  });
});
