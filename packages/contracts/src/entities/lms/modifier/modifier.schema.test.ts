import { describe, expect, it } from "vitest";

import { MODIFIER_CONSTANTS } from "./modifier.constants";
import { createModifierSchema, modifierSchema, updateModifierSchema } from "./modifier.schema";

const cuid = "clz1234567890123456789aaa";

const baseModifier = {
  id: cuid,
  name: "from sofa",
  nameLower: "from sofa",
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("modifierSchema", () => {
  it("round-trips a fully-populated modifier", () => {
    const result = modifierSchema.safeParse(baseModifier);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("from sofa");
    }
  });

  it("accepts a notes list", () => {
    expect(modifierSchema.safeParse({ ...baseModifier, notes: ["from the box"] }).success).toBe(
      true,
    );
  });

  it("rejects a non-cuid id", () => {
    expect(modifierSchema.safeParse({ ...baseModifier, id: "not-a-cuid" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(modifierSchema.safeParse({ ...baseModifier, name: "" }).success).toBe(false);
  });

  it("rejects a name over MAX_NAME_LENGTH", () => {
    expect(
      modifierSchema.safeParse({
        ...baseModifier,
        name: "x".repeat(MODIFIER_CONSTANTS.MAX_NAME_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});

describe("createModifierSchema", () => {
  it("accepts a minimal create payload", () => {
    expect(createModifierSchema.safeParse({ name: "neutral grip" }).success).toBe(true);
  });

  it("normalizes a name (NFKC + trim)", () => {
    const result = createModifierSchema.safeParse({ name: "  Neutral Grip " });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Neutral Grip");
    }
  });

  it("rejects a missing name", () => {
    expect(createModifierSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a whitespace-only name", () => {
    expect(createModifierSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("accepts an optional notes list", () => {
    expect(
      createModifierSchema.safeParse({ name: "from sofa", notes: ["coach note"] }).success,
    ).toBe(true);
  });
});

describe("updateModifierSchema", () => {
  it("accepts an empty object (no-op)", () => {
    expect(updateModifierSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a name-only update", () => {
    expect(updateModifierSchema.safeParse({ name: "renamed" }).success).toBe(true);
  });

  it("accepts a notes-only update", () => {
    expect(updateModifierSchema.safeParse({ notes: ["new note"] }).success).toBe(true);
  });
});
