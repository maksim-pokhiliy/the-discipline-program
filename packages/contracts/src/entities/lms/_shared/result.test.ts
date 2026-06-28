import { describe, expect, it } from "vitest";

import { resultSchema } from "./result";

describe("resultSchema", () => {
  it("accepts a time result with positive seconds", () => {
    expect(resultSchema.safeParse({ type: "time", seconds: 185.5 }).success).toBe(true);
  });

  it("rejects a time result with negative seconds", () => {
    expect(resultSchema.safeParse({ type: "time", seconds: -10 }).success).toBe(false);
  });

  it("rejects a time result with zero seconds", () => {
    expect(resultSchema.safeParse({ type: "time", seconds: 0 }).success).toBe(false);
  });

  it("accepts a rounds_reps result", () => {
    expect(resultSchema.safeParse({ type: "rounds_reps", rounds: 5, reps: 12 }).success).toBe(true);
  });

  it("accepts a rounds_reps result with zero rounds and reps", () => {
    expect(resultSchema.safeParse({ type: "rounds_reps", rounds: 0, reps: 0 }).success).toBe(true);
  });

  it("rejects a rounds_reps result with non-integer reps", () => {
    expect(resultSchema.safeParse({ type: "rounds_reps", rounds: 5, reps: 12.5 }).success).toBe(
      false,
    );
  });

  it("accepts a load result with positive kg", () => {
    expect(resultSchema.safeParse({ type: "load", kg: 102.5 }).success).toBe(true);
  });

  it("rejects a load result with non-positive kg", () => {
    expect(resultSchema.safeParse({ type: "load", kg: 0 }).success).toBe(false);
  });

  it("accepts a load result with a float-trap 2-decimal kg", () => {
    expect(resultSchema.safeParse({ type: "load", kg: 142.45 }).success).toBe(true);
  });

  it("rejects a load result with kg over ONE_RM_MAX_KG", () => {
    expect(resultSchema.safeParse({ type: "load", kg: 10000 }).success).toBe(false);
  });

  it("rejects a load result with kg over two decimals", () => {
    expect(resultSchema.safeParse({ type: "load", kg: 100.125 }).success).toBe(false);
  });

  it("accepts a max_reps result with a positive int", () => {
    expect(resultSchema.safeParse({ type: "max_reps", reps: 24 }).success).toBe(true);
  });

  it("rejects a max_reps result with a non-integer reps", () => {
    expect(resultSchema.safeParse({ type: "max_reps", reps: 24.5 }).success).toBe(false);
  });

  it("rejects a max_reps result with zero reps", () => {
    expect(resultSchema.safeParse({ type: "max_reps", reps: 0 }).success).toBe(false);
  });

  it("accepts a distance result in meters", () => {
    expect(resultSchema.safeParse({ type: "distance", value: 5000, unit: "m" }).success).toBe(true);
  });

  it("accepts a distance result in kilometers", () => {
    expect(resultSchema.safeParse({ type: "distance", value: 5, unit: "km" }).success).toBe(true);
  });

  it("rejects a distance result with a bad unit", () => {
    expect(resultSchema.safeParse({ type: "distance", value: 5, unit: "mi" }).success).toBe(false);
  });

  it("rejects a distance result with non-positive value", () => {
    expect(resultSchema.safeParse({ type: "distance", value: 0, unit: "m" }).success).toBe(false);
  });

  it("accepts a calories result with a positive int", () => {
    expect(resultSchema.safeParse({ type: "calories", value: 60 }).success).toBe(true);
  });

  it("rejects a calories result with a non-integer value", () => {
    expect(resultSchema.safeParse({ type: "calories", value: 60.5 }).success).toBe(false);
  });

  it("rejects an unknown result type", () => {
    expect(resultSchema.safeParse({ type: "mystery", value: 1 }).success).toBe(false);
  });
});
