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

describe("LMS row parity — exercise-only row grammar (rowKind/rowPayload collapsed)", () => {
  it("accepts a minimal exercise row carrying exerciseId directly", () => {
    expect(schemaRowSchema.safeParse(baseRow).success).toBe(true);
  });

  it("accepts a row with sets + a rowGroupId membership", () => {
    expect(
      schemaRowSchema.safeParse({ ...baseRow, sets: 3, rowGroupId: CUID_SECONDARY }).success,
    ).toBe(true);
  });

  it("strips the dropped rowKind discriminator (no payload union survives)", () => {
    const result = schemaRowSchema.safeParse({ ...baseRow, rowKind: "EXERCISE" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("rowKind");
    }
  });

  it("strips the dropped rowPayload field", () => {
    const result = schemaRowSchema.safeParse({
      ...baseRow,
      rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: CUID_PRIMARY } },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("rowPayload");
    }
  });

  it("strips the dropped position field", () => {
    const result = schemaRowSchema.safeParse({ ...baseRow, position: "NEUTRAL_GRIP" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("position");
    }
  });

  it("rejects a row missing exerciseId", () => {
    const withoutExerciseId: Record<string, unknown> = { ...baseRow };

    delete withoutExerciseId.exerciseId;

    expect(schemaRowSchema.safeParse(withoutExerciseId).success).toBe(false);
  });

  it("rejects a row with a non-cuid exerciseId", () => {
    expect(schemaRowSchema.safeParse({ ...baseRow, exerciseId: "not-a-cuid" }).success).toBe(false);
  });
});
