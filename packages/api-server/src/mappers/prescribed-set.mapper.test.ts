import { Decimal } from "@prisma/client/runtime/library";
import { describe, expect, it } from "vitest";

import { WeightType, WeightUnit } from "@repo/contracts/prescribed-set";

import { mapToPrescribedSet } from "./prescribed-set.mapper";

const makeSet = (overrides = {}) => ({
  id: "cls_set_1",
  blockId: "cls_block_1",
  exerciseId: "cls_exercise_1",
  reps: 10,
  weightValue: new Decimal("72.50"),
  weightUnit: "KG" as const,
  weightType: "ABSOLUTE" as const,
  rpe: 8,
  notes: "Controlled tempo",
  sortOrder: 0,
  ...overrides,
});

describe("mapToPrescribedSet", () => {
  it("maps all fields correctly", () => {
    const input = makeSet();
    const result = mapToPrescribedSet(input);

    expect(result).toEqual({
      id: "cls_set_1",
      blockId: "cls_block_1",
      exerciseId: "cls_exercise_1",
      reps: 10,
      weightValue: 72.5,
      weightUnit: WeightUnit.KG,
      weightType: WeightType.ABSOLUTE,
      rpe: 8,
      notes: "Controlled tempo",
      sortOrder: 0,
    });
  });

  it("converts Decimal weightValue to number", () => {
    const input = makeSet({ weightValue: new Decimal("120.75") });
    const result = mapToPrescribedSet(input);

    expect(result.weightValue).toBe(120.75);
    expect(typeof result.weightValue).toBe("number");
  });

  it("keeps null weightValue as null", () => {
    const input = makeSet({ weightValue: null });
    const result = mapToPrescribedSet(input);

    expect(result.weightValue).toBeNull();
  });

  it("handles null reps", () => {
    const input = makeSet({ reps: null });
    const result = mapToPrescribedSet(input);

    expect(result.reps).toBeNull();
  });

  it("handles null rpe", () => {
    const input = makeSet({ rpe: null });
    const result = mapToPrescribedSet(input);

    expect(result.rpe).toBeNull();
  });

  it("handles null notes", () => {
    const input = makeSet({ notes: null });
    const result = mapToPrescribedSet(input);

    expect(result.notes).toBeNull();
  });

  it("maps LB weightUnit", () => {
    const input = makeSet({ weightUnit: "LB" as const });
    const result = mapToPrescribedSet(input);

    expect(result.weightUnit).toBe(WeightUnit.LB);
  });

  it("maps PERCENTAGE weightType", () => {
    const input = makeSet({ weightType: "PERCENTAGE" as const });
    const result = mapToPrescribedSet(input);

    expect(result.weightType).toBe(WeightType.PERCENTAGE);
  });

  it("handles all nullable fields being null simultaneously", () => {
    const input = makeSet({
      reps: null,
      weightValue: null,
      rpe: null,
      notes: null,
    });
    const result = mapToPrescribedSet(input);

    expect(result.reps).toBeNull();
    expect(result.weightValue).toBeNull();
    expect(result.rpe).toBeNull();
    expect(result.notes).toBeNull();
  });
});
