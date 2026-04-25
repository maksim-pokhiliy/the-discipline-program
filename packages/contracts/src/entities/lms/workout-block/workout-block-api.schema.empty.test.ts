import { describe, expect, it } from "vitest";

import {
  getWorkoutBlockResponseSchema,
  getWorkoutBlocksResponseSchema,
} from "./workout-block-api.schema";
import { workoutBlockExerciseSchema, workoutBlockSchema } from "./workout-block.schema";

const VALID_CUID = "clz00000000000000000fake1";
const VALID_CUID_2 = "clz00000000000000000fake2";
const VALID_CUID_3 = "clz00000000000000000fake3";
const VALID_CUID_4 = "clz00000000000000000fake4";
const VALID_CUID_5 = "clz00000000000000000fake5";
const NOW = new Date();

describe("workout-block-api schema empty payloads", () => {
  it("getWorkoutBlocksResponseSchema accepts empty array", () => {
    const result = getWorkoutBlocksResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getWorkoutBlocksResponseSchema rejects null", () => {
    const result = getWorkoutBlocksResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getWorkoutBlocksResponseSchema rejects undefined", () => {
    const result = getWorkoutBlocksResponseSchema.safeParse(undefined);

    expect(result.success).toBe(false);
  });

  it("getWorkoutBlocksResponseSchema rejects object shape", () => {
    const result = getWorkoutBlocksResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("getWorkoutBlockResponseSchema rejects empty object (required fields missing)", () => {
    const result = getWorkoutBlockResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("workoutBlockSchema required fields", () => {
  const validBlock = {
    id: VALID_CUID,
    workoutId: VALID_CUID_2,
    blockTypeId: VALID_CUID_3,
    title: null,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts a minimal valid block (sections optional, title nullable)", () => {
    const result = workoutBlockSchema.safeParse(validBlock);

    expect(result.success).toBe(true);
  });

  it("accepts a block with title set to a string", () => {
    const result = workoutBlockSchema.safeParse({ ...validBlock, title: "Warmup" });

    expect(result.success).toBe(true);
  });

  it("accepts a block with sections explicitly omitted", () => {
    const result = workoutBlockSchema.safeParse(validBlock);

    expect(result.success).toBe(true);
  });

  it("accepts a block with sections set to an empty array", () => {
    const result = workoutBlockSchema.safeParse({ ...validBlock, sections: [] });

    expect(result.success).toBe(true);
  });

  it.each([
    [
      "title",
      {
        id: VALID_CUID,
        workoutId: VALID_CUID_2,
        blockTypeId: VALID_CUID_3,
        sortOrder: 0,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    [
      "workoutId",
      {
        id: VALID_CUID,
        blockTypeId: VALID_CUID_3,
        title: null,
        sortOrder: 0,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    [
      "blockTypeId",
      {
        id: VALID_CUID,
        workoutId: VALID_CUID_2,
        title: null,
        sortOrder: 0,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    [
      "sortOrder",
      {
        id: VALID_CUID,
        workoutId: VALID_CUID_2,
        blockTypeId: VALID_CUID_3,
        title: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  ])("rejects a block missing the %s field", (field, payload) => {
    const result = workoutBlockSchema.safeParse(payload);

    expect(result.success).toBe(false);

    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));

      expect(paths).toContain(field);
    }
  });

  it("rejects a block whose title is undefined (title is required-nullable)", () => {
    const result = workoutBlockSchema.safeParse({ ...validBlock, title: undefined });

    expect(result.success).toBe(false);
  });

  it("rejects scheme-only attrs leaking onto block (no schemeId on block)", () => {
    const result = workoutBlockSchema.safeParse({
      ...validBlock,
      schemeId: VALID_CUID_4,
    });

    expect(result.success).toBe(true);
  });
});

describe("workoutBlockExerciseSchema XOR refine on (sectionId, emomSlotId)", () => {
  const baseExercise = {
    id: VALID_CUID,
    exerciseId: VALID_CUID_2,
    repScheme: "STRAIGHT" as const,
    repValues: [10],
    sets: 1,
    prescription: null,
    restSec: null,
    note: null,
    complexGroup: null,
    complexOrder: null,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts an exercise with sectionId set and emomSlotId null", () => {
    const result = workoutBlockExerciseSchema.safeParse({
      ...baseExercise,
      sectionId: VALID_CUID_3,
      emomSlotId: null,
    });

    expect(result.success).toBe(true);
  });

  it("accepts an exercise with emomSlotId set and sectionId null", () => {
    const result = workoutBlockExerciseSchema.safeParse({
      ...baseExercise,
      sectionId: null,
      emomSlotId: VALID_CUID_4,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an exercise with both sectionId and emomSlotId set", () => {
    const result = workoutBlockExerciseSchema.safeParse({
      ...baseExercise,
      sectionId: VALID_CUID_3,
      emomSlotId: VALID_CUID_4,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const customIssue = result.error.issues.find((i) => i.code === "custom");

      expect(customIssue).toBeDefined();
    }
  });

  it("rejects an exercise with both sectionId and emomSlotId null", () => {
    const result = workoutBlockExerciseSchema.safeParse({
      ...baseExercise,
      sectionId: null,
      emomSlotId: null,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const customIssue = result.error.issues.find((i) => i.code === "custom");

      expect(customIssue).toBeDefined();
    }
  });

  it("rejects an exercise missing both sectionId and emomSlotId", () => {
    const result = workoutBlockExerciseSchema.safeParse(baseExercise);

    expect(result.success).toBe(false);
  });

  it("rejects an exercise missing the renamed sectionId field (was blockId before T5)", () => {
    const result = workoutBlockExerciseSchema.safeParse({
      ...baseExercise,
      blockId: VALID_CUID_5,
      emomSlotId: null,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));

      expect(paths).toContain("sectionId");
    }
  });
});
