import { describe, expect, it } from "vitest";

import { exactOrRangeSchema } from "./exact-or-range";

describe("exactOrRangeSchema", () => {
  it("accepts a positive integer", () => {
    expect(exactOrRangeSchema.safeParse(5).success).toBe(true);
  });

  it("accepts a range where min < max", () => {
    expect(exactOrRangeSchema.safeParse({ min: 3, max: 9 }).success).toBe(true);
  });

  it("rejects zero", () => {
    expect(exactOrRangeSchema.safeParse(0).success).toBe(false);
  });

  it("rejects a negative integer", () => {
    expect(exactOrRangeSchema.safeParse(-1).success).toBe(false);
  });

  it("rejects a range where min > max", () => {
    expect(exactOrRangeSchema.safeParse({ min: 9, max: 3 }).success).toBe(false);
  });

  it("rejects a range where min === max", () => {
    expect(exactOrRangeSchema.safeParse({ min: 5, max: 5 }).success).toBe(false);
  });

  it("rejects a non-integer range bound", () => {
    expect(exactOrRangeSchema.safeParse({ min: 1.5, max: 3 }).success).toBe(false);
  });

  it("rejects a range missing max", () => {
    expect(exactOrRangeSchema.safeParse({ min: 5 }).success).toBe(false);
  });
});
