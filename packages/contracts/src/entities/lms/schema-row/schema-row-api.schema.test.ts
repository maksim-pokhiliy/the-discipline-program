import { describe, expect, it } from "vitest";

import {
  createSchemaRowRequestSchema,
  createSchemaRowResponseSchema,
  deleteSchemaRowParamsSchema,
  getSchemaRowByIdParamsSchema,
  getSchemaRowsResponseSchema,
  reorderSchemaRowsRequestSchema,
  reorderSchemaRowsResponseSchema,
  updateSchemaRowParamsSchema,
  updateSchemaRowRequestSchema,
  updateSchemaRowResponseSchema,
} from "./schema-row-api.schema";
import {
  createSchemaRowSchema,
  reorderSchemaRowsSchema,
  schemaRowSchema,
  updateSchemaRowSchema,
} from "./schema-row.schema";

const cuid = "clz1234567890123456789aaa";

describe("schema-row id param schemas", () => {
  it("getSchemaRowByIdParamsSchema accepts a cuid id", () => {
    expect(getSchemaRowByIdParamsSchema.safeParse({ id: cuid }).success).toBe(true);
  });

  it("updateSchemaRowParamsSchema rejects a non-cuid id", () => {
    expect(updateSchemaRowParamsSchema.safeParse({ id: "not-a-cuid" }).success).toBe(false);
  });

  it("deleteSchemaRowParamsSchema rejects missing id", () => {
    expect(deleteSchemaRowParamsSchema.safeParse({}).success).toBe(false);
  });
});

describe("schema-row request/response aliases", () => {
  it("createSchemaRowRequestSchema is createSchemaRowSchema", () => {
    expect(createSchemaRowRequestSchema).toBe(createSchemaRowSchema);
  });

  it("createSchemaRowResponseSchema is schemaRowSchema", () => {
    expect(createSchemaRowResponseSchema).toBe(schemaRowSchema);
  });

  it("updateSchemaRowRequestSchema is updateSchemaRowSchema", () => {
    expect(updateSchemaRowRequestSchema).toBe(updateSchemaRowSchema);
  });

  it("updateSchemaRowResponseSchema is schemaRowSchema", () => {
    expect(updateSchemaRowResponseSchema).toBe(schemaRowSchema);
  });

  it("reorderSchemaRowsRequestSchema is reorderSchemaRowsSchema", () => {
    expect(reorderSchemaRowsRequestSchema).toBe(reorderSchemaRowsSchema);
  });
});

describe("getSchemaRowsResponseSchema", () => {
  it("accepts an empty array", () => {
    expect(getSchemaRowsResponseSchema.safeParse([]).success).toBe(true);
  });

  it("rejects a non-array root", () => {
    expect(getSchemaRowsResponseSchema.safeParse({}).success).toBe(false);
  });
});

describe("reorderSchemaRowsResponseSchema", () => {
  it("accepts wrapper { schemaRows: [] }", () => {
    expect(reorderSchemaRowsResponseSchema.safeParse({ schemaRows: [] }).success).toBe(true);
  });

  it("rejects a bare array", () => {
    expect(reorderSchemaRowsResponseSchema.safeParse([]).success).toBe(false);
  });
});
