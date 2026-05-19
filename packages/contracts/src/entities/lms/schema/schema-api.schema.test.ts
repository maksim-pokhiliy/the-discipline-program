import { describe, expect, it } from "vitest";

import {
  createSchemaRequestSchema,
  createSchemaResponseSchema,
  deleteSchemaParamsSchema,
  getSchemaByIdParamsSchema,
  getSchemasResponseSchema,
  reorderSchemasRequestSchema,
  reorderSchemasResponseSchema,
  updateSchemaParamsSchema,
  updateSchemaRequestSchema,
  updateSchemaResponseSchema,
} from "./schema-api.schema";
import {
  createSchemaSchema,
  reorderSchemasSchema,
  schemaSchema,
  updateSchemaSchema,
} from "./schema.schema";

const cuid = "clz1234567890123456789aaa";

describe("schema id param schemas", () => {
  it("getSchemaByIdParamsSchema accepts a cuid id", () => {
    expect(getSchemaByIdParamsSchema.safeParse({ id: cuid }).success).toBe(true);
  });

  it("updateSchemaParamsSchema rejects a non-cuid id", () => {
    expect(updateSchemaParamsSchema.safeParse({ id: "not-a-cuid" }).success).toBe(false);
  });

  it("deleteSchemaParamsSchema rejects missing id", () => {
    expect(deleteSchemaParamsSchema.safeParse({}).success).toBe(false);
  });
});

describe("schema request/response aliases", () => {
  it("createSchemaRequestSchema is createSchemaSchema", () => {
    expect(createSchemaRequestSchema).toBe(createSchemaSchema);
  });

  it("createSchemaResponseSchema is schemaSchema", () => {
    expect(createSchemaResponseSchema).toBe(schemaSchema);
  });

  it("updateSchemaRequestSchema is updateSchemaSchema", () => {
    expect(updateSchemaRequestSchema).toBe(updateSchemaSchema);
  });

  it("updateSchemaResponseSchema is schemaSchema", () => {
    expect(updateSchemaResponseSchema).toBe(schemaSchema);
  });

  it("reorderSchemasRequestSchema is reorderSchemasSchema", () => {
    expect(reorderSchemasRequestSchema).toBe(reorderSchemasSchema);
  });
});

describe("getSchemasResponseSchema", () => {
  it("accepts an empty array", () => {
    expect(getSchemasResponseSchema.safeParse([]).success).toBe(true);
  });

  it("rejects a non-array root", () => {
    expect(getSchemasResponseSchema.safeParse({}).success).toBe(false);
  });
});

describe("reorderSchemasResponseSchema", () => {
  it("accepts a wrapper { schemas: [] }", () => {
    expect(reorderSchemasResponseSchema.safeParse({ schemas: [] }).success).toBe(true);
  });

  it("rejects a bare array", () => {
    expect(reorderSchemasResponseSchema.safeParse([]).success).toBe(false);
  });
});
