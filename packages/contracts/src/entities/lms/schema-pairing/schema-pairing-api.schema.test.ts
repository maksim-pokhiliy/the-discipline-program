import { describe, expect, it } from "vitest";

import {
  createSchemaPairingRequestSchema,
  createSchemaPairingResponseSchema,
  deleteSchemaPairingParamsSchema,
  getSchemaPairingsResponseSchema,
} from "./schema-pairing-api.schema";
import { createSchemaPairingSchema, schemaPairingSchema } from "./schema-pairing.schema";

const cuid = "clz1234567890123456789aaa";

describe("schema-pairing api schemas", () => {
  it("getSchemaPairingsResponseSchema accepts empty array", () => {
    expect(getSchemaPairingsResponseSchema.safeParse([]).success).toBe(true);
  });

  it("createSchemaPairingRequestSchema is createSchemaPairingSchema", () => {
    expect(createSchemaPairingRequestSchema).toBe(createSchemaPairingSchema);
  });

  it("createSchemaPairingResponseSchema is schemaPairingSchema", () => {
    expect(createSchemaPairingResponseSchema).toBe(schemaPairingSchema);
  });

  it("deleteSchemaPairingParamsSchema accepts a cuid id", () => {
    expect(deleteSchemaPairingParamsSchema.safeParse({ id: cuid }).success).toBe(true);
  });

  it("deleteSchemaPairingParamsSchema rejects missing id", () => {
    expect(deleteSchemaPairingParamsSchema.safeParse({}).success).toBe(false);
  });
});
