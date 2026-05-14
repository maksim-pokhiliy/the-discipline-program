import { describe, expect, it } from "vitest";

import { LABEL_CONSTANTS } from "./label.constants";
import { createLabelSchema, labelSchema, updateLabelSchema } from "./label.schema";

const baseInput = {
  name: "Push Day",
  applicableLevels: ["DAY"] as const,
  notes: null,
};

const baseLabel = {
  id: "clp9z8x7w0000abcd1234efgh",
  name: "Push Day",
  nameLower: "push day",
  applicableLevels: ["DAY"] as const,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ZERO_WIDTH_SPACE = "​";

describe("createLabelSchema", () => {
  it("accepts minimal valid input (QA-Must-2)", () => {
    const result = createLabelSchema.safeParse(baseInput);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Push Day");
      expect(result.data.applicableLevels).toEqual(["DAY"]);
      expect(result.data.notes).toBeNull();
    }
  });

  it("strips zero-width chars from name (QA-Must-4)", () => {
    const result = createLabelSchema.safeParse({
      ...baseInput,
      name: `Push${ZERO_WIDTH_SPACE}Day`,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("PushDay");
    }
  });

  it("rejects an all-zero-width name (QA-Must-4)", () => {
    const result = createLabelSchema.safeParse({
      ...baseInput,
      name: "​‌‍",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty applicableLevels (QA-Must-5)", () => {
    const result = createLabelSchema.safeParse({ ...baseInput, applicableLevels: [] });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid applicableLevels member (QA-Must-6)", () => {
    const result = createLabelSchema.safeParse({ ...baseInput, applicableLevels: ["FOO"] });

    expect(result.success).toBe(false);
  });

  it("rejects applicableLevels with more than 3 entries (QA-Must-7)", () => {
    const result = createLabelSchema.safeParse({
      ...baseInput,
      applicableLevels: ["DAY", "SESSION", "BLOCK", "DAY"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate applicableLevels (QA-Must-8)", () => {
    const result = createLabelSchema.safeParse({
      ...baseInput,
      applicableLevels: ["DAY", "DAY"],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Applicable levels must be unique");
    }
  });

  it("rejects empty name (QA-Must-9)", () => {
    const result = createLabelSchema.safeParse({ ...baseInput, name: "" });

    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name (QA-Must-9)", () => {
    const result = createLabelSchema.safeParse({ ...baseInput, name: "   " });

    expect(result.success).toBe(false);
  });

  it("accepts name at MAX_NAME_LENGTH (QA-Must-9)", () => {
    const result = createLabelSchema.safeParse({
      ...baseInput,
      name: "x".repeat(LABEL_CONSTANTS.MAX_NAME_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects name longer than MAX_NAME_LENGTH (QA-Must-9)", () => {
    const result = createLabelSchema.safeParse({
      ...baseInput,
      name: "x".repeat(LABEL_CONSTANTS.MAX_NAME_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("accepts notes at MAX_NOTES_LENGTH (QA-Must-9)", () => {
    const result = createLabelSchema.safeParse({
      ...baseInput,
      notes: "x".repeat(LABEL_CONSTANTS.MAX_NOTES_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects notes longer than MAX_NOTES_LENGTH (QA-Must-9)", () => {
    const result = createLabelSchema.safeParse({
      ...baseInput,
      notes: "x".repeat(LABEL_CONSTANTS.MAX_NOTES_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});

describe("updateLabelSchema", () => {
  it("accepts an empty object (.partial())", () => {
    const result = updateLabelSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("accepts a single-field name subset", () => {
    const result = updateLabelSchema.safeParse({ name: "Renamed" });

    expect(result.success).toBe(true);
  });

  it("accepts a single-field applicableLevels subset", () => {
    const result = updateLabelSchema.safeParse({ applicableLevels: ["BLOCK"] });

    expect(result.success).toBe(true);
  });

  it("accepts a single-field notes subset", () => {
    const result = updateLabelSchema.safeParse({ notes: "coaching note" });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate applicableLevels (QA-Must-8)", () => {
    const result = updateLabelSchema.safeParse({ applicableLevels: ["DAY", "DAY"] });

    expect(result.success).toBe(false);
  });
});

describe("labelSchema", () => {
  it("rejects empty applicableLevels (QA-Must-5)", () => {
    const result = labelSchema.safeParse({ ...baseLabel, applicableLevels: [] });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid applicableLevels member (QA-Must-6)", () => {
    const result = labelSchema.safeParse({ ...baseLabel, applicableLevels: ["FOO"] });

    expect(result.success).toBe(false);
  });

  it("rejects applicableLevels with more than 3 entries (QA-Must-7)", () => {
    const result = labelSchema.safeParse({
      ...baseLabel,
      applicableLevels: ["DAY", "SESSION", "BLOCK", "DAY"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate applicableLevels (QA-Must-8)", () => {
    const result = labelSchema.safeParse({
      ...baseLabel,
      applicableLevels: ["DAY", "DAY"],
    });

    expect(result.success).toBe(false);
  });
});
