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

  it("accepts a single-axis byProfile (level RX/SC) with a cell per value", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ name: "level", values: ["RX", "SC"] }],
        cells: [
          { coords: ["RX"], kg: 43 },
          { coords: ["SC"], kg: 30 },
        ],
      }).success,
    ).toBe(true);
  });

  it("accepts a two-axis byProfile covering the full cartesian product (Wall Ball level×sex)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [
          { name: "level", values: ["RX", "SC"] },
          { name: "sex", values: ["♂", "♀"] },
        ],
        cells: [
          { coords: ["RX", "♂"], kg: 9 },
          { coords: ["RX", "♀"], kg: 6 },
          { coords: ["SC", "♂"], kg: 6 },
          { coords: ["SC", "♀"], kg: 4 },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects a two-axis byProfile missing a cell (only 3 of 4 combinations covered)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [
          { name: "level", values: ["RX", "SC"] },
          { name: "sex", values: ["♂", "♀"] },
        ],
        cells: [
          { coords: ["RX", "♂"], kg: 9 },
          { coords: ["RX", "♀"], kg: 6 },
          { coords: ["SC", "♂"], kg: 6 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects a coord that is not a value of its axis", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ name: "level", values: ["RX", "SC"] }],
        cells: [
          { coords: ["RX"], kg: 43 },
          { coords: ["MASTER"], kg: 30 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects a third axis (max two axes)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [
          { name: "level", values: ["RX"] },
          { name: "sex", values: ["♂"] },
          { name: "age", values: ["masters"] },
        ],
        cells: [{ coords: ["RX", "♂", "masters"], kg: 9 }],
      }).success,
    ).toBe(false);
  });

  it("rejects a non-positive cell kg", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ name: "level", values: ["RX"] }],
        cells: [{ coords: ["RX"], kg: 0 }],
      }).success,
    ).toBe(false);
  });

  it("rejects an empty axis name", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ name: "", values: ["RX"] }],
        cells: [{ coords: ["RX"], kg: 9 }],
      }).success,
    ).toBe(false);
  });

  it("rejects an empty axis values list", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ name: "level", values: [] }],
        cells: [{ coords: ["RX"], kg: 9 }],
      }).success,
    ).toBe(false);
  });

  it("rejects a byProfile axis with duplicate values (QA-001)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ name: "level", values: ["RX", "RX"] }],
        cells: [
          { coords: ["RX"], kg: 43 },
          { coords: ["RX"], kg: 30 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects the dropped byProfile first/second shape", () => {
    expect(loadSchema.safeParse({ kind: "byProfile", first: 24, second: 16 }).success).toBe(false);
  });

  it("rejects the dropped flat entries shape", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        entries: [
          { label: "M", kg: 24 },
          { label: "F", kg: 16 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects the dropped none kind", () => {
    expect(loadSchema.safeParse({ kind: "none" }).success).toBe(false);
  });

  it("rejects unknown kind", () => {
    expect(loadSchema.safeParse({ kind: "mystery" }).success).toBe(false);
  });
});
