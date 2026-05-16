import { describe, expect, it } from "vitest";

import { EXERCISE_CONSTANTS } from "./exercise.constants";
import { createExerciseSchema, updateExerciseSchema } from "./exercise.schema";

const baseInput = {
  canonicalName: "Back Squat",
  primaryEquipment: "BARBELL" as const,
  movementTypeTagPrimary: "SQUAT" as const,
};

const ZERO_WIDTH_SPACE = "​";

describe("createExerciseSchema", () => {
  it("accepts minimal valid input and fills defaults (AC-T6)", () => {
    const result = createExerciseSchema.safeParse(baseInput);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.canonicalCompoundType).toBe("ATOMIC");
      expect(result.data.placeholderFlag).toBe(false);
      expect(result.data.defaultDemoUrls).toEqual([]);
      expect(result.data.aliases).toEqual([]);
    }
  });

  it("rejects empty canonicalName (AC-T6)", () => {
    const result = createExerciseSchema.safeParse({ ...baseInput, canonicalName: "" });

    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only canonicalName after trim", () => {
    const result = createExerciseSchema.safeParse({ ...baseInput, canonicalName: "   " });

    expect(result.success).toBe(false);
  });

  it("rejects canonicalName longer than MAX_CANONICAL_NAME_LENGTH", () => {
    const result = createExerciseSchema.safeParse({
      ...baseInput,
      canonicalName: "x".repeat(EXERCISE_CONSTANTS.MAX_CANONICAL_NAME_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("normalizes zero-width chars in canonicalName (QA-001 fix, QA-Must-1)", () => {
    const result = createExerciseSchema.safeParse({
      ...baseInput,
      canonicalName: `Back Squat${ZERO_WIDTH_SPACE}`,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.canonicalName).toBe("Back Squat");
    }
  });

  it("rejects defaultDemoUrls with non-http(s) scheme (QA-002 fix, QA-Must-10)", () => {
    const result = createExerciseSchema.safeParse({
      ...baseInput,
      defaultDemoUrls: ["javascript:alert(1)"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects defaultDemoUrls with element longer than MAX_URL_LENGTH (QA-004)", () => {
    const longUrl = `https://example.com/${"a".repeat(EXERCISE_CONSTANTS.MAX_URL_LENGTH)}`;
    const result = createExerciseSchema.safeParse({
      ...baseInput,
      defaultDemoUrls: [longUrl],
    });

    expect(result.success).toBe(false);
  });

  it("rejects defaultDemoUrls array longer than MAX_ARRAY_LENGTH (QA-007)", () => {
    const urls = Array.from(
      { length: EXERCISE_CONSTANTS.MAX_ARRAY_LENGTH + 1 },
      (_, i) => `https://example.com/${i}`,
    );
    const result = createExerciseSchema.safeParse({ ...baseInput, defaultDemoUrls: urls });

    expect(result.success).toBe(false);
  });

  it("rejects aliases array longer than MAX_ARRAY_LENGTH (QA-007)", () => {
    const aliases = Array.from(
      { length: EXERCISE_CONSTANTS.MAX_ARRAY_LENGTH + 1 },
      (_, i) => `alias-${i}`,
    );
    const result = createExerciseSchema.safeParse({ ...baseInput, aliases });

    expect(result.success).toBe(false);
  });

  it("rejects notes longer than MAX_NOTES_LENGTH (QA-006)", () => {
    const result = createExerciseSchema.safeParse({
      ...baseInput,
      notes: "x".repeat(EXERCISE_CONSTANTS.MAX_NOTES_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects PLACEHOLDER compound type with placeholderFlag=false (QA-010)", () => {
    const result = createExerciseSchema.safeParse({
      ...baseInput,
      canonicalCompoundType: "PLACEHOLDER",
      placeholderFlag: false,
    });

    expect(result.success).toBe(false);
  });

  it("rejects ATOMIC compound type with placeholderFlag=true (QA-010)", () => {
    const result = createExerciseSchema.safeParse({
      ...baseInput,
      canonicalCompoundType: "ATOMIC",
      placeholderFlag: true,
    });

    expect(result.success).toBe(false);
  });

  it("accepts PLACEHOLDER compound type with placeholderFlag=true (QA-010)", () => {
    const result = createExerciseSchema.safeParse({
      ...baseInput,
      canonicalCompoundType: "PLACEHOLDER",
      placeholderFlag: true,
    });

    expect(result.success).toBe(true);
  });
});

describe("updateExerciseSchema", () => {
  it("accepts partial input with only canonicalName (AC-T6 .partial())", () => {
    const result = updateExerciseSchema.safeParse({ canonicalName: "Renamed" });

    expect(result.success).toBe(true);
  });

  it("accepts empty object (.partial() allows everything optional)", () => {
    const result = updateExerciseSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("enforces placeholder cross-field refine on partial updates (QA-010)", () => {
    const result = updateExerciseSchema.safeParse({
      canonicalCompoundType: "PLACEHOLDER",
      placeholderFlag: false,
    });

    expect(result.success).toBe(false);
  });
});
