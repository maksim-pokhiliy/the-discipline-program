import { describe, expect, it } from "vitest";

import { intensitySchema } from "./intensity";

describe("intensitySchema", () => {
  it("accepts effortPercent.value alone", () => {
    const result = intensitySchema.safeParse({ effortPercent: { value: 75 } });

    expect(result.success).toBe(true);
  });

  it("accepts effortPercent.range alone (min < max)", () => {
    const result = intensitySchema.safeParse({
      effortPercent: { range: { min: 60, max: 80 } },
    });

    expect(result.success).toBe(true);
  });

  it("rejects effortPercent.range when min >= max", () => {
    expect(
      intensitySchema.safeParse({ effortPercent: { range: { min: 80, max: 80 } } }).success,
    ).toBe(false);
    expect(
      intensitySchema.safeParse({ effortPercent: { range: { min: 80, max: 60 } } }).success,
    ).toBe(false);
  });

  it("accepts rpe alone", () => {
    const result = intensitySchema.safeParse({ rpe: { value: 7 } });

    expect(result.success).toBe(true);
  });

  it("accepts pace alone (any of 4 enum values)", () => {
    for (const value of ["easy", "moderate", "hard", "recovery"] as const) {
      expect(intensitySchema.safeParse({ pace: value }).success).toBe(true);
    }
  });

  it("accepts hrZone alone (any of Z1-Z5)", () => {
    for (const zone of ["Z1", "Z2", "Z3", "Z4", "Z5"] as const) {
      expect(intensitySchema.safeParse({ hrZone: { zone } }).success).toBe(true);
    }
  });

  it("accepts numericPace alone", () => {
    const result = intensitySchema.safeParse({
      numericPace: { value: "4:30", distanceUnit: "km", paceType: "min_per_distance" },
    });

    expect(result.success).toBe(true);
  });

  it("accepts multiple dimensions together (effort + pace)", () => {
    const result = intensitySchema.safeParse({
      effortPercent: { value: 75 },
      pace: "moderate",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty object {} (refine at-least-one)", () => {
    const result = intensitySchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("intensity must set at least one dimension");
    }
  });

  it("rejects an object with only an unknown key (refine-driven, not strict)", () => {
    const result = intensitySchema.safeParse({ unknown: 1 });

    expect(result.success).toBe(false);
  });

  it("strips unknown keys when a known dimension is present (Zod default passthrough)", () => {
    const result = intensitySchema.safeParse({ rpe: { value: 7 }, unknown: 1 });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ rpe: { value: 7 } });
    }
  });

  it("rejects effortPercent.value > 100", () => {
    expect(intensitySchema.safeParse({ effortPercent: { value: 101 } }).success).toBe(false);
  });

  it("rejects rpe.value > 10", () => {
    expect(intensitySchema.safeParse({ rpe: { value: 11 } }).success).toBe(false);
  });

  it("rejects hrZone.zone not in Z1-Z5", () => {
    expect(intensitySchema.safeParse({ hrZone: { zone: "Z6" } }).success).toBe(false);
  });

  it("rejects numericPace with empty value string", () => {
    expect(
      intensitySchema.safeParse({
        numericPace: { value: "", distanceUnit: "km", paceType: "min_per_distance" },
      }).success,
    ).toBe(false);
  });

  it("rejects lowercase HrZone (z1)", () => {
    expect(intensitySchema.safeParse({ hrZone: { zone: "z1" } }).success).toBe(false);
  });
});
