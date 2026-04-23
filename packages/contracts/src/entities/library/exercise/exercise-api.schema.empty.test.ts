import { describe, expect, it } from "vitest";

import {
  createExerciseRequestSchema,
  getExercisesResponseSchema,
  mergeExerciseRequestSchema,
} from "./exercise-api.schema";

describe("exercise-api schema empty payloads", () => {
  it("createExerciseRequestSchema rejects empty object (canonicalName required)", () => {
    const result = createExerciseRequestSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("createExerciseRequestSchema applies defaults for aliases/measurementUnits/hasLoad", () => {
    const result = createExerciseRequestSchema.safeParse({ canonicalName: "Front Squat" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.aliases).toEqual([]);
      expect(result.data.measurementUnits).toEqual(["REPS"]);
      expect(result.data.hasLoad).toBe(false);
    }
  });

  it("mergeExerciseRequestSchema rejects empty object", () => {
    const result = mergeExerciseRequestSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("mergeExerciseRequestSchema rejects non-cuid target", () => {
    const result = mergeExerciseRequestSchema.safeParse({ targetExerciseId: "not-a-cuid" });

    expect(result.success).toBe(false);
  });

  it("getExercisesResponseSchema rejects null", () => {
    const result = getExercisesResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getExercisesResponseSchema rejects empty object", () => {
    const result = getExercisesResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
