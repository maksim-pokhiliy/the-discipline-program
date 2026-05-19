import { describe, expect, it } from "vitest";

import { getArchetypesResponseSchema } from "./archetype-api.schema";

describe("getArchetypesResponseSchema", () => {
  it("accepts an empty array (catalog absent)", () => {
    expect(getArchetypesResponseSchema.safeParse([]).success).toBe(true);
  });

  it("rejects a non-array root", () => {
    expect(getArchetypesResponseSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a bare object", () => {
    expect(getArchetypesResponseSchema.safeParse({ archetypes: [] }).success).toBe(false);
  });
});
