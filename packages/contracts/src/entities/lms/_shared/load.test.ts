import { describe, expect, it } from "vitest";

import { loadSchema, percentageReferenceSchema } from "./load";

const CUID = "ck1234567890123456789012";

describe("percentageReferenceSchema", () => {
  it("accepts self scope", () => {
    expect(percentageReferenceSchema.safeParse({ scope: "self" }).success).toBe(true);
  });

  it("accepts movement_family with movementFamily string", () => {
    expect(
      percentageReferenceSchema.safeParse({
        scope: "movement_family",
        movementFamily: "squat",
      }).success,
    ).toBe(true);
  });

  it("accepts other_exercise with cuid targetExerciseId", () => {
    expect(
      percentageReferenceSchema.safeParse({
        scope: "other_exercise",
        targetExerciseId: CUID,
      }).success,
    ).toBe(true);
  });

  it("rejects movement_family with empty movementFamily", () => {
    expect(
      percentageReferenceSchema.safeParse({
        scope: "movement_family",
        movementFamily: "",
      }).success,
    ).toBe(false);
  });

  it("rejects other_exercise with non-cuid targetExerciseId", () => {
    expect(
      percentageReferenceSchema.safeParse({
        scope: "other_exercise",
        targetExerciseId: "abc",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown scope", () => {
    expect(percentageReferenceSchema.safeParse({ scope: "global" }).success).toBe(false);
  });
});

describe("loadSchema", () => {
  it("accepts absolute with nested single Weight", () => {
    expect(
      loadSchema.safeParse({
        kind: "absolute",
        weight: { variant: "single", valueKg: 20 },
      }).success,
    ).toBe(true);
  });

  it("accepts absolute with nested compound_device Weight", () => {
    expect(
      loadSchema.safeParse({
        kind: "absolute",
        weight: {
          variant: "compound_device",
          equipment: "DUMBBELL",
          count: 2,
          valueKg: 15,
        },
      }).success,
    ).toBe(true);
  });

  it("rejects absolute with invalid Weight (negative valueKg)", () => {
    expect(
      loadSchema.safeParse({
        kind: "absolute",
        weight: { variant: "single", valueKg: -5 },
      }).success,
    ).toBe(false);
  });

  it("accepts percentage with self reference", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 75,
        reference: { scope: "self" },
      }).success,
    ).toBe(true);
  });

  it("accepts percentage with movement_family reference", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 80,
        reference: { scope: "movement_family", movementFamily: "deadlift" },
      }).success,
    ).toBe(true);
  });

  it("accepts percentage with other_exercise reference", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 70,
        reference: { scope: "other_exercise", targetExerciseId: CUID },
      }).success,
    ).toBe(true);
  });

  it("accepts percentage with rangeMax > value", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 70,
        rangeMax: 80,
        reference: { scope: "self" },
      }).success,
    ).toBe(true);
  });

  it("rejects percentage with rangeMax === value", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 70,
        rangeMax: 70,
        reference: { scope: "self" },
      }).success,
    ).toBe(false);
  });

  it("rejects percentage with rangeMax < value", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 70,
        rangeMax: 60,
        reference: { scope: "self" },
      }).success,
    ).toBe(false);
  });

  it("rejects percentage value > 200", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 250,
        reference: { scope: "self" },
      }).success,
    ).toBe(false);
  });

  it("rejects percentage rangeMax > 200", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 100,
        rangeMax: 250,
        reference: { scope: "self" },
      }).success,
    ).toBe(false);
  });

  it("accepts bodyweight with no extras", () => {
    expect(loadSchema.safeParse({ kind: "bodyweight" }).success).toBe(true);
  });

  it("accepts byProfile with positive first/second", () => {
    expect(loadSchema.safeParse({ kind: "byProfile", first: 24, second: 16 }).success).toBe(true);
  });

  it("rejects byProfile with non-positive first", () => {
    expect(loadSchema.safeParse({ kind: "byProfile", first: 0, second: 16 }).success).toBe(false);
  });

  it("rejects byProfile missing second", () => {
    expect(loadSchema.safeParse({ kind: "byProfile", first: 24 }).success).toBe(false);
  });

  it("accepts none with no extras", () => {
    expect(loadSchema.safeParse({ kind: "none" }).success).toBe(true);
  });

  it("rejects the dropped without_weight kind", () => {
    expect(
      loadSchema.safeParse({ kind: "without_weight", context: "drop_set_stage" }).success,
    ).toBe(false);
  });

  it("rejects the dropped unspecified kind", () => {
    expect(loadSchema.safeParse({ kind: "unspecified" }).success).toBe(false);
  });

  it("rejects unknown kind", () => {
    expect(loadSchema.safeParse({ kind: "mystery" }).success).toBe(false);
  });

  it("rejects percentage with negative value", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: -10,
        reference: { scope: "self" },
      }).success,
    ).toBe(false);
  });

  it("accepts percentage with value 0", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 0,
        reference: { scope: "self" },
      }).success,
    ).toBe(true);
  });

  it("accepts percentage with value 200 (upper bound)", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 200,
        reference: { scope: "self" },
      }).success,
    ).toBe(true);
  });

  it("rejects absolute missing weight", () => {
    expect(loadSchema.safeParse({ kind: "absolute" }).success).toBe(false);
  });
});
