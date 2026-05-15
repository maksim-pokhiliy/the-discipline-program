import { describe, expect, it } from "vitest";

import { dayOfWeekSchema, dayOfWeekValues } from "./day-of-week";

describe("dayOfWeekSchema", () => {
  it("accepts every value in dayOfWeekValues", () => {
    for (const value of dayOfWeekValues) {
      expect(dayOfWeekSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects values outside the enum", () => {
    expect(dayOfWeekSchema.safeParse("Monday").success).toBe(false);
    expect(dayOfWeekSchema.safeParse("OCTODAY").success).toBe(false);
    expect(dayOfWeekSchema.safeParse(0).success).toBe(false);
    expect(dayOfWeekSchema.safeParse(null).success).toBe(false);
  });
});
