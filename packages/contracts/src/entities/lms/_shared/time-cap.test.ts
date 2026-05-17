import { describe, expect, it } from "vitest";

import { timeCapSchema } from "./time-cap";

describe("timeCapSchema", () => {
  it("accepts { min: 5, unit: 'min' } (no max)", () => {
    const result = timeCapSchema.safeParse({ min: 5, unit: "min" });

    expect(result.success).toBe(true);
  });

  it("accepts { min: 5, max: 10, unit: 'min' }", () => {
    const result = timeCapSchema.safeParse({ min: 5, max: 10, unit: "min" });

    expect(result.success).toBe(true);
  });

  it("accepts { min: 30, max: 60, unit: 'sec' }", () => {
    const result = timeCapSchema.safeParse({ min: 30, max: 60, unit: "sec" });

    expect(result.success).toBe(true);
  });

  it("rejects min: 0", () => {
    expect(timeCapSchema.safeParse({ min: 0, unit: "min" }).success).toBe(false);
  });

  it("rejects min: -1", () => {
    expect(timeCapSchema.safeParse({ min: -1, unit: "min" }).success).toBe(false);
  });

  it("rejects max <= min", () => {
    expect(timeCapSchema.safeParse({ min: 5, max: 5, unit: "min" }).success).toBe(false);
    expect(timeCapSchema.safeParse({ min: 5, max: 3, unit: "min" }).success).toBe(false);
  });

  it("rejects unit not in {min, sec}", () => {
    expect(timeCapSchema.safeParse({ min: 5, unit: "hour" }).success).toBe(false);
  });

  it("rejects missing min", () => {
    expect(timeCapSchema.safeParse({ unit: "min" }).success).toBe(false);
  });

  it("rejects missing unit", () => {
    expect(timeCapSchema.safeParse({ min: 5 }).success).toBe(false);
  });
});
