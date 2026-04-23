import { describe, expect, it } from "vitest";

import { createBlockTypeRequestSchema, getBlockTypesResponseSchema } from "./block-type-api.schema";

describe("block-type-api schema empty payloads", () => {
  it("createBlockTypeRequestSchema rejects empty object (slug/name required)", () => {
    const result = createBlockTypeRequestSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("createBlockTypeRequestSchema accepts valid minimal input with defaults", () => {
    const result = createBlockTypeRequestSchema.safeParse({
      slug: "strength",
      name: "Strength",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.sortOrder).toBe(0);
      expect(result.data.active).toBe(true);
    }
  });

  it("getBlockTypesResponseSchema accepts empty array", () => {
    const result = getBlockTypesResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getBlockTypesResponseSchema rejects null", () => {
    const result = getBlockTypesResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });
});
