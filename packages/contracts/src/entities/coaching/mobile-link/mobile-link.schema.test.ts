import { describe, expect, it } from "vitest";

import { createMobileLinkSchema, mobileLinkSchema } from "./mobile-link.schema";

const baseEntity = {
  id: "clp9z8x7w0000abcd1234efgh",
  planId: "clp9z8x7w0001abcd1234efgh",
  channel: "GENERAL" as const,
  legacyLevelId: 7,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("mobileLinkSchema", () => {
  it("accepts a full valid link", () => {
    const result = mobileLinkSchema.safeParse(baseEntity);

    expect(result.success).toBe(true);
  });

  it("rejects a channel other than GENERAL", () => {
    const result = mobileLinkSchema.safeParse({ ...baseEntity, channel: "PRIVATE" });

    expect(result.success).toBe(false);
  });

  it("rejects a non-integer legacyLevelId", () => {
    const result = mobileLinkSchema.safeParse({ ...baseEntity, legacyLevelId: 7.5 });

    expect(result.success).toBe(false);
  });
});

describe("createMobileLinkSchema", () => {
  it("accepts a valid create payload", () => {
    const result = createMobileLinkSchema.safeParse({
      planId: "clp9z8x7w0001abcd1234efgh",
      legacyLevelId: 7,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a non-cuid planId", () => {
    const result = createMobileLinkSchema.safeParse({ planId: "nope", legacyLevelId: 7 });

    expect(result.success).toBe(false);
  });
});
