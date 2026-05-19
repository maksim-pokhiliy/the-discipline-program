import { describe, expect, it } from "vitest";

import { MAX_SUB_FORMS, REP_UNITS, compoundRepDefinitionSchema, repNotationSchema } from "./reps";

const CUID_A = "ck1234567890123456789012";
const CUID_B = "ck0987654321098765432109";

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

  it("accepts max for all 3 subForms", () => {
    for (const subForm of MAX_SUB_FORMS) {
      expect(repNotationSchema.safeParse({ kind: "max", subForm }).success).toBe(true);
    }
  });

  it("accepts max progressive with progressiveSeed", () => {
    expect(
      repNotationSchema.safeParse({
        kind: "max",
        subForm: "progressive",
        progressiveSeed: "5,10,15",
      }).success,
    ).toBe(true);
  });

  it("accepts max with targetExerciseId cuid", () => {
    expect(
      repNotationSchema.safeParse({
        kind: "max",
        subForm: "in_remaining_time",
        targetExerciseId: CUID_A,
      }).success,
    ).toBe(true);
  });

  it("rejects max with invalid cuid targetExerciseId", () => {
    expect(
      repNotationSchema.safeParse({
        kind: "max",
        subForm: "bare",
        targetExerciseId: "not-a-cuid",
      }).success,
    ).toBe(false);
  });

  it("rejects max with empty progressiveSeed string", () => {
    expect(
      repNotationSchema.safeParse({
        kind: "max",
        subForm: "progressive",
        progressiveSeed: "",
      }).success,
    ).toBe(false);
  });

  it("accepts implicit with no extras", () => {
    expect(repNotationSchema.safeParse({ kind: "implicit" }).success).toBe(true);
  });

  it("strips unknown keys for implicit (default passthrough)", () => {
    const result = repNotationSchema.safeParse({ kind: "implicit", spurious: 1 });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ kind: "implicit" });
    }
  });

  it("accepts total_flag with positive int value", () => {
    expect(repNotationSchema.safeParse({ kind: "total_flag", value: 100 }).success).toBe(true);
  });

  it("accepts compound_rep_unit with no extras", () => {
    expect(repNotationSchema.safeParse({ kind: "compound_rep_unit" }).success).toBe(true);
  });

  it("rejects unknown kind", () => {
    expect(repNotationSchema.safeParse({ kind: "mystery" }).success).toBe(false);
  });
});

describe("compoundRepDefinitionSchema", () => {
  it("accepts curly_brace with single-element composition", () => {
    expect(
      compoundRepDefinitionSchema.safeParse({
        form: "curly_brace",
        composition: [{ exerciseId: CUID_A, count: 3 }],
      }).success,
    ).toBe(true);
  });

  it("accepts inline_equality with totalReps + multi-element composition", () => {
    expect(
      compoundRepDefinitionSchema.safeParse({
        form: "inline_equality",
        totalReps: 10,
        composition: [
          { exerciseId: CUID_A, count: 5 },
          { exerciseId: CUID_B, count: 5 },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects curly_brace with empty composition", () => {
    expect(
      compoundRepDefinitionSchema.safeParse({ form: "curly_brace", composition: [] }).success,
    ).toBe(false);
  });

  it("rejects inline_equality with empty composition", () => {
    expect(
      compoundRepDefinitionSchema.safeParse({
        form: "inline_equality",
        totalReps: 10,
        composition: [],
      }).success,
    ).toBe(false);
  });

  it("rejects composition entry with non-cuid exerciseId", () => {
    expect(
      compoundRepDefinitionSchema.safeParse({
        form: "curly_brace",
        composition: [{ exerciseId: "abc", count: 3 }],
      }).success,
    ).toBe(false);
  });

  it("rejects inline_equality missing totalReps", () => {
    expect(
      compoundRepDefinitionSchema.safeParse({
        form: "inline_equality",
        composition: [{ exerciseId: CUID_A, count: 5 }],
      }).success,
    ).toBe(false);
  });

  it("rejects unknown form", () => {
    expect(
      compoundRepDefinitionSchema.safeParse({
        form: "stacked",
        composition: [{ exerciseId: CUID_A, count: 3 }],
      }).success,
    ).toBe(false);
  });
});
