import { describe, expect, it } from "vitest";

import { getPlanDaysQuerySchema, updatePlanDayRequestSchema } from "./plan-day-api.schema";

describe("getPlanDaysQuerySchema", () => {
  it("accepts from <= to within 366 days", () => {
    const result = getPlanDaysQuerySchema.safeParse({
      from: "2026-01-01",
      to: "2026-12-31",
    });

    expect(result.success).toBe(true);
  });

  it("accepts from === to (single-day window)", () => {
    const result = getPlanDaysQuerySchema.safeParse({
      from: "2026-05-15",
      to: "2026-05-15",
    });

    expect(result.success).toBe(true);
  });

  it("rejects from > to", () => {
    const result = getPlanDaysQuerySchema.safeParse({
      from: "2026-12-31",
      to: "2026-01-01",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("from must be <= to");
    }
  });

  it("rejects range > 366 days", () => {
    const result = getPlanDaysQuerySchema.safeParse({
      from: "2020-01-01",
      to: "2030-01-01",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("range must be <= 366 days");
    }
  });
});

describe("updatePlanDayRequestSchema", () => {
  it("rejects empty update body", () => {
    const result = updatePlanDayRequestSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("patch cannot be empty");
    }
  });

  it("accepts a patch with dayTypeId set to null", () => {
    const result = updatePlanDayRequestSchema.safeParse({ dayTypeId: null });

    expect(result.success).toBe(true);
  });
});
