import { describe, expect, it } from "vitest";

import { loadSchema, percentageReferenceSchema } from "./load";

const CUID = "ck1234567890123456789012";

describe("percentageReferenceSchema", () => {
  it("accepts self scope", () => {
    expect(percentageReferenceSchema.safeParse({ scope: "self" }).success).toBe(true);
  });

  it("accepts other_exercise with cuid targetExerciseId", () => {
    expect(
      percentageReferenceSchema.safeParse({
        scope: "other_exercise",
        targetExerciseId: CUID,
      }).success,
    ).toBe(true);
  });

  it("rejects the dropped movement_family scope", () => {
    expect(
      percentageReferenceSchema.safeParse({
        scope: "movement_family",
        movementFamily: "squat",
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
  it("accepts absolute with count 1", () => {
    expect(loadSchema.safeParse({ kind: "absolute", count: 1, kg: 20 }).success).toBe(true);
  });

  it("accepts absolute with count 2", () => {
    expect(loadSchema.safeParse({ kind: "absolute", count: 2, kg: 15 }).success).toBe(true);
  });

  it("rejects absolute with count 3", () => {
    expect(loadSchema.safeParse({ kind: "absolute", count: 3, kg: 15 }).success).toBe(false);
  });

  it("rejects absolute with non-positive kg", () => {
    expect(loadSchema.safeParse({ kind: "absolute", count: 1, kg: -5 }).success).toBe(false);
  });

  it("rejects the dropped absolute weight VO shape", () => {
    expect(
      loadSchema.safeParse({ kind: "absolute", weight: { variant: "single", valueKg: 20 } })
        .success,
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

  it("rejects percentage with the dropped movement_family reference", () => {
    expect(
      loadSchema.safeParse({
        kind: "percentage",
        value: 80,
        reference: { scope: "movement_family", movementFamily: "deadlift" },
      }).success,
    ).toBe(false);
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

  it("accepts bodyweight with no extras", () => {
    expect(loadSchema.safeParse({ kind: "bodyweight" }).success).toBe(true);
  });

  it("accepts byProfile with a labelled entries list", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        entries: [
          { label: "M", kg: 24 },
          { label: "F", kg: 16 },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects byProfile with an empty entries list", () => {
    expect(loadSchema.safeParse({ kind: "byProfile", entries: [] }).success).toBe(false);
  });

  it("rejects byProfile with a non-positive entry kg", () => {
    expect(
      loadSchema.safeParse({ kind: "byProfile", entries: [{ label: "M", kg: 0 }] }).success,
    ).toBe(false);
  });

  it("rejects byProfile with an empty entry label", () => {
    expect(
      loadSchema.safeParse({ kind: "byProfile", entries: [{ label: "", kg: 24 }] }).success,
    ).toBe(false);
  });

  it("rejects the dropped byProfile first/second shape", () => {
    expect(loadSchema.safeParse({ kind: "byProfile", first: 24, second: 16 }).success).toBe(false);
  });

  it("rejects the dropped none kind", () => {
    expect(loadSchema.safeParse({ kind: "none" }).success).toBe(false);
  });

  it("rejects unknown kind", () => {
    expect(loadSchema.safeParse({ kind: "mystery" }).success).toBe(false);
  });
});
