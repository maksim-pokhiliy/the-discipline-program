import { describe, expect, it } from "vitest";

import { REP_UNITS, repNotationSchema } from "./reps";

describe("repNotationSchema", () => {
  it("accepts count with positive int value", () => {
    expect(repNotationSchema.safeParse({ kind: "count", value: 10 }).success).toBe(true);
  });

  it("rejects count with negative value", () => {
    expect(repNotationSchema.safeParse({ kind: "count", value: -5 }).success).toBe(false);
  });

  it("rejects count with zero value", () => {
    expect(repNotationSchema.safeParse({ kind: "count", value: 0 }).success).toBe(false);
  });

  it("rejects count with non-integer value", () => {
    expect(repNotationSchema.safeParse({ kind: "count", value: 5.5 }).success).toBe(false);
  });

  it("accepts range with min < max", () => {
    expect(repNotationSchema.safeParse({ kind: "range", min: 1, max: 5 }).success).toBe(true);
  });

  it("rejects range with min === max", () => {
    expect(repNotationSchema.safeParse({ kind: "range", min: 5, max: 5 }).success).toBe(false);
  });

  it("rejects range with min > max", () => {
    expect(repNotationSchema.safeParse({ kind: "range", min: 8, max: 3 }).success).toBe(false);
  });

  it("rejects range with zero values", () => {
    expect(repNotationSchema.safeParse({ kind: "range", min: 0, max: 5 }).success).toBe(false);
  });

  it("accepts unit_bound with value only", () => {
    expect(
      repNotationSchema.safeParse({ kind: "unit_bound", unit: "sec", value: 30 }).success,
    ).toBe(true);
  });

  it("accepts unit_bound with range only", () => {
    expect(
      repNotationSchema.safeParse({
        kind: "unit_bound",
        unit: "min",
        range: { min: 1, max: 5 },
      }).success,
    ).toBe(true);
  });

  it("rejects unit_bound with both value and range (XOR)", () => {
    expect(
      repNotationSchema.safeParse({
        kind: "unit_bound",
        unit: "sec",
        value: 30,
        range: { min: 20, max: 40 },
      }).success,
    ).toBe(false);
  });

  it("rejects unit_bound with neither value nor range", () => {
    expect(repNotationSchema.safeParse({ kind: "unit_bound", unit: "sec" }).success).toBe(false);
  });

  it("accepts unit_bound for all 3 REP_UNITS", () => {
    for (const unit of REP_UNITS) {
      expect(repNotationSchema.safeParse({ kind: "unit_bound", unit, value: 5 }).success).toBe(
        true,
      );
    }
  });

  it("rejects unit_bound range with min >= max", () => {
    expect(
      repNotationSchema.safeParse({
        kind: "unit_bound",
        unit: "sec",
        range: { min: 10, max: 5 },
      }).success,
    ).toBe(false);
  });

  it("accepts max with no tail", () => {
    expect(repNotationSchema.safeParse({ kind: "max" }).success).toBe(true);
  });

  it("accepts max with a free-text tail", () => {
    expect(repNotationSchema.safeParse({ kind: "max", tail: "3-3-3-2-2-1-1" }).success).toBe(true);
  });

  it("rejects max with an empty tail string", () => {
    expect(repNotationSchema.safeParse({ kind: "max", tail: "" }).success).toBe(false);
  });

  it("strips the dropped max subForm field (default passthrough)", () => {
    const result = repNotationSchema.safeParse({ kind: "max", subForm: "bare" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ kind: "max" });
    }
  });

  it("rejects the dropped implicit kind", () => {
    expect(repNotationSchema.safeParse({ kind: "implicit" }).success).toBe(false);
  });

  it("rejects the dropped total_flag kind", () => {
    expect(repNotationSchema.safeParse({ kind: "total_flag", value: 100 }).success).toBe(false);
  });

  it("rejects the dropped compound_rep_unit kind", () => {
    expect(repNotationSchema.safeParse({ kind: "compound_rep_unit" }).success).toBe(false);
  });

  it("rejects unknown kind", () => {
    expect(repNotationSchema.safeParse({ kind: "mystery" }).success).toBe(false);
  });
});
