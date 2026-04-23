import { describe, expect, it } from "vitest";

import { createSchemeRequestSchema, getSchemesResponseSchema } from "./scheme-api.schema";

describe("scheme-api schema empty payloads", () => {
  it("createSchemeRequestSchema rejects empty object (slug/name/kind required)", () => {
    const result = createSchemeRequestSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("createSchemeRequestSchema accepts valid minimal input with defaults", () => {
    const result = createSchemeRequestSchema.safeParse({
      slug: "emom",
      name: "EMOM",
      kind: "EMOM",
    });

    expect(result.success).toBe(true);
  });

  it("getSchemesResponseSchema accepts empty array", () => {
    const result = getSchemesResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getSchemesResponseSchema rejects null", () => {
    const result = getSchemesResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });
});
