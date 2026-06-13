import { describe, expect, it } from "vitest";

import { schemaRowSchema } from "../entities/lms/schema-row";

import { CUID_PRIMARY, CUID_SECONDARY } from "./_cuid-helper";

const baseRow = {
  id: CUID_PRIMARY,
  schemaId: CUID_SECONDARY,
  order: 1,
  exerciseId: CUID_PRIMARY,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("LMS row — rejection coverage (collapsed grammar)", () => {
  it("rejects order: 0 (positive int)", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, order: 0 }).success).toBe(false);
  });

  it("rejects sets: 0 (positive int when set)", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, sets: 0 }).success).toBe(false);
  });

  it("rejects a non-cuid rowGroupId", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, rowGroupId: "not-a-cuid" }).success).toBe(false);
  });

  it("rejects a modifiers array carrying a non-modifier entry", () => {
    expect(
      schemaRowSchema.safeParse({ ...baseRow, modifiers: [{ id: "not-a-cuid" }] }).success,
    ).toBe(false);
  });

  it("rejects an empty-string note in the notes list (min(1))", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, notes: [""] }).success).toBe(false);
  });

  it("rejects the dropped sequence VO field shape (no longer a row field)", () => {
    const result = schemaRowSchema.safeParse({
      ...baseRow,
      sequence: { kind: "before_named", targetLabel: "A" },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("sequence");
    }
  });

  it("rejects the dropped row-level intensity field shape (schema-only now)", () => {
    const result = schemaRowSchema.safeParse({ ...baseRow, intensity: { rpe: { value: 7 } } });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("intensity");
    }
  });
});
