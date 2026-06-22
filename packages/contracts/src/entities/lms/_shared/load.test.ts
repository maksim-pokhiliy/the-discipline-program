import { describe, expect, it } from "vitest";

import { loadSchema, percentageReferenceSchema } from "./load";

const CUID = "ck1234567890123456789012";
const CUID_TWO = "ck0987654321098765432109";

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

  it("accepts a single catalog-axis byProfile (level RX/SC) with a cell per value", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ kind: "catalog", axisId: CUID, label: "Level", values: ["RX", "SC"] }],
        cells: [
          { coords: ["RX"], kg: 43 },
          { coords: ["SC"], kg: 30 },
        ],
      }).success,
    ).toBe(true);
  });

  it("accepts a two catalog-axis byProfile covering the full cartesian product", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [
          { kind: "catalog", axisId: CUID, label: "Level", values: ["RX", "SC"] },
          { kind: "catalog", axisId: CUID_TWO, label: "Tier", values: ["A", "B"] },
        ],
        cells: [
          { coords: ["RX", "A"], kg: 9 },
          { coords: ["RX", "B"], kg: 6 },
          { coords: ["SC", "A"], kg: 6 },
          { coords: ["SC", "B"], kg: 4 },
        ],
      }).success,
    ).toBe(true);
  });

  it("accepts a single human-gender axis byProfile resolving to Male/Female cells", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ kind: "human", attribute: "gender" }],
        cells: [
          { coords: ["Male"], kg: 9 },
          { coords: ["Female"], kg: 6 },
        ],
      }).success,
    ).toBe(true);
  });

  it("accepts a human-gender axis paired with a catalog axis (Wall Ball level×sex)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [
          { kind: "catalog", axisId: CUID, label: "Level", values: ["RX", "SC"] },
          { kind: "human", attribute: "gender" },
        ],
        cells: [
          { coords: ["RX", "Male"], kg: 9 },
          { coords: ["RX", "Female"], kg: 6 },
          { coords: ["SC", "Male"], kg: 6 },
          { coords: ["SC", "Female"], kg: 4 },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects a two-axis byProfile missing a cell (only 3 of 4 combinations covered)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [
          { kind: "catalog", axisId: CUID, label: "Level", values: ["RX", "SC"] },
          { kind: "human", attribute: "gender" },
        ],
        cells: [
          { coords: ["RX", "Male"], kg: 9 },
          { coords: ["RX", "Female"], kg: 6 },
          { coords: ["SC", "Male"], kg: 6 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects a coord that is not a value of its catalog axis", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ kind: "catalog", axisId: CUID, label: "Level", values: ["RX", "SC"] }],
        cells: [
          { coords: ["RX"], kg: 43 },
          { coords: ["MASTER"], kg: 30 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects a coord that is not a valid gender for a human axis", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ kind: "human", attribute: "gender" }],
        cells: [
          { coords: ["Male"], kg: 9 },
          { coords: ["Other"], kg: 6 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects a third axis (max two axes)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [
          { kind: "catalog", axisId: CUID, label: "Level", values: ["RX"] },
          { kind: "catalog", axisId: CUID_TWO, label: "Tier", values: ["A"] },
          { kind: "human", attribute: "gender" },
        ],
        cells: [{ coords: ["RX", "A", "Male"], kg: 9 }],
      }).success,
    ).toBe(false);
  });

  it("rejects a non-positive cell kg", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ kind: "catalog", axisId: CUID, label: "Level", values: ["RX"] }],
        cells: [{ coords: ["RX"], kg: 0 }],
      }).success,
    ).toBe(false);
  });

  it("rejects an unbound catalog axis (empty axisId)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ kind: "catalog", axisId: "", label: "Level", values: ["RX"] }],
        cells: [{ coords: ["RX"], kg: 9 }],
      }).success,
    ).toBe(false);
  });

  it("rejects an empty catalog axis label", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ kind: "catalog", axisId: CUID, label: "", values: ["RX"] }],
        cells: [{ coords: ["RX"], kg: 9 }],
      }).success,
    ).toBe(false);
  });

  it("rejects an empty catalog axis values list", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ kind: "catalog", axisId: CUID, label: "Level", values: [] }],
        cells: [{ coords: ["RX"], kg: 9 }],
      }).success,
    ).toBe(false);
  });

  it("rejects a catalog axis with duplicate values (QA-001)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [{ kind: "catalog", axisId: CUID, label: "Level", values: ["RX", "RX"] }],
        cells: [
          { coords: ["RX"], kg: 43 },
          { coords: ["RX"], kg: 30 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects two catalog axes sharing the same axisId (not distinct dimensions)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [
          { kind: "catalog", axisId: CUID, label: "Level", values: ["RX", "SC"] },
          { kind: "catalog", axisId: CUID, label: "Level", values: ["RX", "SC"] },
        ],
        cells: [
          { coords: ["RX", "RX"], kg: 9 },
          { coords: ["RX", "SC"], kg: 6 },
          { coords: ["SC", "RX"], kg: 6 },
          { coords: ["SC", "SC"], kg: 4 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects two human-gender axes (not distinct dimensions)", () => {
    expect(
      loadSchema.safeParse({
        kind: "byProfile",
        axes: [
          { kind: "human", attribute: "gender" },
          { kind: "human", attribute: "gender" },
        ],
        cells: [
          { coords: ["Male", "Male"], kg: 9 },
          { coords: ["Male", "Female"], kg: 6 },
          { coords: ["Female", "Male"], kg: 6 },
          { coords: ["Female", "Female"], kg: 4 },
        ],
      }).success,
    ).toBe(false);
  });

  it("strips an extra values key on a human axis (discriminatedUnion strip)", () => {
    const result = loadSchema.safeParse({
      kind: "byProfile",
      axes: [{ kind: "human", attribute: "gender", values: ["Other"] }],
      cells: [
        { coords: ["Male"], kg: 9 },
        { coords: ["Female"], kg: 6 },
      ],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      const [axis] = result.data.kind === "byProfile" ? result.data.axes : [];

      expect(axis).not.toHaveProperty("values");
    }
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
