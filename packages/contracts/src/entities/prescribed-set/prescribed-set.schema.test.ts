import { describe, expect, it } from "vitest";

import { WeightType, WeightUnit } from "./prescribed-set.constants";
import {
  createPrescribedSetSchema,
  prescribedSetSchema,
  updatePrescribedSetSchema,
} from "./prescribed-set.schema";

const VALID_CUID = "clz00000000000000000fake1";
const VALID_CUID_2 = "clz00000000000000000fake2";

describe("prescribedSetSchema", () => {
  it("accepts a full valid set with all required fields", () => {
    const result = prescribedSetSchema.safeParse({
      id: VALID_CUID,
      blockId: VALID_CUID_2,
      exerciseId: VALID_CUID,
      sets: 3,
      reps: 10,
      weightValue: 80.5,
      weightUnit: WeightUnit.KG,
      weightType: WeightType.ABSOLUTE,
      rpe: 8,
      notes: "Keep elbows tight",
      sortOrder: 0,
    });

    expect(result.success).toBe(true);
  });

  it("accepts nullable fields as null", () => {
    const result = prescribedSetSchema.safeParse({
      id: VALID_CUID,
      blockId: VALID_CUID_2,
      exerciseId: VALID_CUID,
      sets: null,
      reps: null,
      weightValue: null,
      weightUnit: WeightUnit.KG,
      weightType: WeightType.ABSOLUTE,
      rpe: null,
      notes: null,
      sortOrder: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid weightUnit enum value", () => {
    const result = prescribedSetSchema.safeParse({
      id: VALID_CUID,
      blockId: VALID_CUID_2,
      exerciseId: VALID_CUID,
      sets: 3,
      reps: 10,
      weightValue: 100,
      weightUnit: "STONE",
      weightType: WeightType.ABSOLUTE,
      rpe: 8,
      notes: null,
      sortOrder: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid weightType enum value", () => {
    const result = prescribedSetSchema.safeParse({
      id: VALID_CUID,
      blockId: VALID_CUID_2,
      exerciseId: VALID_CUID,
      sets: 3,
      reps: 10,
      weightValue: 100,
      weightUnit: WeightUnit.LB,
      weightType: "RELATIVE",
      rpe: 8,
      notes: null,
      sortOrder: 0,
    });

    expect(result.success).toBe(false);
  });

  it("validates all WeightUnit enum values", () => {
    for (const unit of Object.values(WeightUnit)) {
      const result = prescribedSetSchema.safeParse({
        id: VALID_CUID,
        blockId: VALID_CUID_2,
        exerciseId: VALID_CUID,
        sets: 3,
        reps: 10,
        weightValue: 50,
        weightUnit: unit,
        weightType: WeightType.ABSOLUTE,
        rpe: 5,
        notes: null,
        sortOrder: 0,
      });

      expect(result.success).toBe(true);
    }
  });

  it("validates all WeightType enum values", () => {
    for (const type of Object.values(WeightType)) {
      const result = prescribedSetSchema.safeParse({
        id: VALID_CUID,
        blockId: VALID_CUID_2,
        exerciseId: VALID_CUID,
        sets: 3,
        reps: 10,
        weightValue: 50,
        weightUnit: WeightUnit.KG,
        weightType: type,
        rpe: 5,
        notes: null,
        sortOrder: 0,
      });

      expect(result.success).toBe(true);
    }
  });
});

describe("createPrescribedSetSchema", () => {
  it("accepts exerciseId + sets only", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      sets: 5,
    });

    expect(result.success).toBe(true);
  });

  it("accepts exerciseId + reps only", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      reps: 12,
    });

    expect(result.success).toBe(true);
  });

  it("accepts exerciseId + weightValue only", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      weightValue: 100,
    });

    expect(result.success).toBe(true);
  });

  it("accepts exerciseId + rpe only", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      rpe: 7,
    });

    expect(result.success).toBe(true);
  });

  it("accepts all fields present", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      sets: 4,
      reps: 8,
      weightValue: 60,
      weightUnit: WeightUnit.KG,
      weightType: WeightType.PERCENTAGE,
      rpe: 9,
      notes: "Warm-up set",
    });

    expect(result.success).toBe(true);
  });

  it("rejects exerciseId only with no sets/reps/weightValue/rpe", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing exerciseId", () => {
    const result = createPrescribedSetSchema.safeParse({
      sets: 3,
      reps: 10,
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative reps", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      reps: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects zero reps", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      reps: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative sets", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      sets: -3,
    });

    expect(result.success).toBe(false);
  });

  it("rejects rpe greater than 10", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      rpe: 11,
    });

    expect(result.success).toBe(false);
  });

  it("rejects rpe less than 1", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      rpe: 0,
    });

    expect(result.success).toBe(false);
  });

  it("accepts rpe at boundary value 1", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      rpe: 1,
    });

    expect(result.success).toBe(true);
  });

  it("accepts rpe at boundary value 10", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      rpe: 10,
    });

    expect(result.success).toBe(true);
  });

  it("rejects notes exceeding 500 characters", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      sets: 3,
      notes: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("accepts notes at exactly 500 characters", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      sets: 3,
      notes: "a".repeat(500),
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid weightUnit enum", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      sets: 3,
      weightUnit: "STONE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid weightType enum", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      sets: 3,
      weightType: "RELATIVE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative weightValue", () => {
    const result = createPrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      weightValue: -50,
    });

    expect(result.success).toBe(false);
  });
});

describe("updatePrescribedSetSchema", () => {
  it("accepts partial update with just sets", () => {
    const result = updatePrescribedSetSchema.safeParse({
      sets: 5,
    });

    expect(result.success).toBe(true);
  });

  it("accepts partial update with just reps", () => {
    const result = updatePrescribedSetSchema.safeParse({
      reps: 12,
    });

    expect(result.success).toBe(true);
  });

  it("accepts partial update with just notes", () => {
    const result = updatePrescribedSetSchema.safeParse({
      notes: "updated note",
    });

    expect(result.success).toBe(true);
  });

  it("accepts setting nullable fields to null", () => {
    const result = updatePrescribedSetSchema.safeParse({
      sets: null,
      reps: null,
      weightValue: null,
      rpe: null,
      notes: null,
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updatePrescribedSetSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("accepts full update with all fields", () => {
    const result = updatePrescribedSetSchema.safeParse({
      exerciseId: VALID_CUID,
      sets: 4,
      reps: 10,
      weightValue: 80,
      weightUnit: WeightUnit.LB,
      weightType: WeightType.PERCENTAGE,
      rpe: 6,
      notes: "Go heavy",
    });

    expect(result.success).toBe(true);
  });

  it("rejects notes exceeding 500 characters", () => {
    const result = updatePrescribedSetSchema.safeParse({
      notes: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("rejects rpe greater than 10", () => {
    const result = updatePrescribedSetSchema.safeParse({
      rpe: 11,
    });

    expect(result.success).toBe(false);
  });

  it("rejects rpe less than 1 (but allows null)", () => {
    const fail = updatePrescribedSetSchema.safeParse({ rpe: 0 });

    expect(fail.success).toBe(false);

    const pass = updatePrescribedSetSchema.safeParse({ rpe: null });

    expect(pass.success).toBe(true);
  });

  it("rejects invalid exerciseId format", () => {
    const result = updatePrescribedSetSchema.safeParse({
      exerciseId: "not-a-cuid",
    });

    expect(result.success).toBe(false);
  });
});
