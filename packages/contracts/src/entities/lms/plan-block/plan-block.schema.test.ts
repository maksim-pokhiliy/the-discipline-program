import { describe, expect, it } from "vitest";

import { PLAN_BLOCK_CONSTANTS } from "./plan-block.constants";
import { createPlanBlockSchema, updatePlanBlockSchema } from "./plan-block.schema";

const baseValid = {
  sessionId: "ckxabcdefghijklmnopqrst",
  order: 0,
  schemeTypeId: "ckxabcdefghijklmnopqrsu",
  blockTypeIds: ["ckxabcdefghijklmnopqrsv"],
};

const validItem = {
  order: 0,
  exerciseId: "ckxabcdefghijklmnopqrsx",
  prescription: {
    reps: { kind: "FIXED" as const, value: 5 },
    sideMode: "BILATERAL" as const,
    modifiers: [],
  },
};

describe("createPlanBlockSchema", () => {
  it("accepts a body without schemeParams (server fills via defaultSchemeParams)", () => {
    const result = createPlanBlockSchema.safeParse(baseValid);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(Object.prototype.hasOwnProperty.call(result.data, "schemeParams")).toBe(false);
    }
  });

  it("strips schemeParams when present in body (server-only field)", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      schemeParams: { kind: "NONE" as const },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(Object.prototype.hasOwnProperty.call(result.data, "schemeParams")).toBe(false);
    }
  });

  it("accepts a body without items field", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      blockTypeIds: ["ckxabcdefghijklmnopqrsv", "ckxabcdefghijklmnopqrsw"],
      notes: "warmup couplet",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a body with empty items array", () => {
    const result = createPlanBlockSchema.safeParse({ ...baseValid, items: [] });

    expect(result.success).toBe(true);
  });

  it("accepts a body with items array (create-shape rows, no id)", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      items: [validItem, { ...validItem, order: 1, exerciseId: "ckxabcdefghijklmnopqrsy" }],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a body with items array (update-shape rows, with id)", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      items: [{ ...validItem, id: "ckxabcdefghijklmnopqr01" }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an item with duplicate alternative exerciseIds", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      items: [
        {
          ...validItem,
          alternatives: [
            { exerciseId: "ckxabcdefghijklmnopqrsv" },
            { exerciseId: "ckxabcdefghijklmnopqrsv" },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate blockTypeIds", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      blockTypeIds: ["ckxabcdefghijklmnopqrsv", "ckxabcdefghijklmnopqrsv"],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("blockTypeIds must be unique");
    }
  });

  it("rejects NUL byte in notes", () => {
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      notes: "before\0after",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("must not contain NUL byte");
    }
  });
});

describe("updatePlanBlockSchema", () => {
  it("accepts a patch with items only", () => {
    const result = updatePlanBlockSchema.safeParse({ items: [validItem] });

    expect(result.success).toBe(true);
  });

  it("accepts a patch with items mixing create-shape and update-shape rows", () => {
    const result = updatePlanBlockSchema.safeParse({
      items: [validItem, { ...validItem, id: "ckxabcdefghijklmnopqr01", order: 1 }],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a patch with empty items array (delete-all)", () => {
    const result = updatePlanBlockSchema.safeParse({ items: [] });

    expect(result.success).toBe(true);
  });

  it("rejects an item with primary id reused as alternative", () => {
    const result = updatePlanBlockSchema.safeParse({
      items: [
        {
          ...validItem,
          alternatives: [{ exerciseId: validItem.exerciseId }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects items array exceeding MAX_ITEMS_PER_BLOCK", () => {
    const overCap = Array.from(
      { length: PLAN_BLOCK_CONSTANTS.MAX_ITEMS_PER_BLOCK + 1 },
      (_, i) => ({
        ...validItem,
        order: i,
      }),
    );

    const result = updatePlanBlockSchema.safeParse({ items: overCap });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("at most");
    }
  });

  it("accepts items array at MAX_ITEMS_PER_BLOCK", () => {
    const atCap = Array.from({ length: PLAN_BLOCK_CONSTANTS.MAX_ITEMS_PER_BLOCK }, (_, i) => ({
      ...validItem,
      order: i,
    }));

    const result = updatePlanBlockSchema.safeParse({ items: atCap });

    expect(result.success).toBe(true);
  });

  it("rejects items array with duplicate ids", () => {
    const duplicateId = "ckxabcdefghijklmnopqr01";
    const result = updatePlanBlockSchema.safeParse({
      items: [
        { ...validItem, id: duplicateId },
        { ...validItem, id: duplicateId, order: 1 },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("unique ids");
    }
  });

  it("accepts items array with mixed ids and undefined ids", () => {
    const result = updatePlanBlockSchema.safeParse({
      items: [
        { ...validItem, id: "ckxabcdefghijklmnopqr01" },
        { ...validItem, order: 1 },
        { ...validItem, id: "ckxabcdefghijklmnopqr02", order: 2 },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe("createPlanBlockSchema items array refinements", () => {
  it("rejects items array exceeding MAX_ITEMS_PER_BLOCK", () => {
    const overCap = Array.from(
      { length: PLAN_BLOCK_CONSTANTS.MAX_ITEMS_PER_BLOCK + 1 },
      (_, i) => ({
        ...validItem,
        order: i,
      }),
    );

    const result = createPlanBlockSchema.safeParse({ ...baseValid, items: overCap });

    expect(result.success).toBe(false);
  });

  it("rejects items array with duplicate ids", () => {
    const duplicateId = "ckxabcdefghijklmnopqr01";
    const result = createPlanBlockSchema.safeParse({
      ...baseValid,
      items: [
        { ...validItem, id: duplicateId },
        { ...validItem, id: duplicateId, order: 1 },
      ],
    });

    expect(result.success).toBe(false);
  });
});
