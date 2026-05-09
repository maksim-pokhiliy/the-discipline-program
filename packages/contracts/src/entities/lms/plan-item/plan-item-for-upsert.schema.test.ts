import { describe, expect, it } from "vitest";

import { planItemForUpsertSchema } from "./plan-item-for-upsert.schema";

const baseValid = {
  order: 0,
  exerciseId: "ckxabcdefghijklmnopqrsu",
  prescription: {
    reps: { kind: "FIXED" as const, value: 5 },
    sideMode: "BILATERAL" as const,
    modifiers: [],
  },
};

describe("planItemForUpsertSchema", () => {
  it("accepts a row without id (create shape)", () => {
    const result = planItemForUpsertSchema.safeParse({ ...baseValid });

    expect(result.success).toBe(true);
  });

  it("accepts a row with id (update shape)", () => {
    const result = planItemForUpsertSchema.safeParse({
      ...baseValid,
      id: "ckxabcdefghijklmnopqr01",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a row with unique alternatives that exclude primary", () => {
    const result = planItemForUpsertSchema.safeParse({
      ...baseValid,
      alternatives: [
        { exerciseId: "ckxabcdefghijklmnopqrsv" },
        { exerciseId: "ckxabcdefghijklmnopqrsw" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a row with notes", () => {
    const result = planItemForUpsertSchema.safeParse({
      ...baseValid,
      notes: "tempo 31x1",
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate alternative exerciseIds", () => {
    const result = planItemForUpsertSchema.safeParse({
      ...baseValid,
      alternatives: [
        { exerciseId: "ckxabcdefghijklmnopqrsv" },
        { exerciseId: "ckxabcdefghijklmnopqrsv" },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("alternatives must have unique");
    }
  });

  it("rejects an alternative matching the primary exerciseId", () => {
    const result = planItemForUpsertSchema.safeParse({
      ...baseValid,
      exerciseId: "ckxabcdefghijklmnopqrsu",
      alternatives: [{ exerciseId: "ckxabcdefghijklmnopqrsu" }],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("must not include the primary");
    }
  });

  it("rejects a row missing exerciseId", () => {
    const result = planItemForUpsertSchema.safeParse({
      order: 0,
      prescription: baseValid.prescription,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-cuid id", () => {
    const result = planItemForUpsertSchema.safeParse({
      ...baseValid,
      id: "not-a-cuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects NUL byte in notes", () => {
    const result = planItemForUpsertSchema.safeParse({
      ...baseValid,
      notes: "before\0after",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("must not contain NUL byte");
    }
  });
});
