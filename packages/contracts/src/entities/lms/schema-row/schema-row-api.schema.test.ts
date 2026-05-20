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
import { createSchemaRowSchema, schemaRowSchema, updateSchemaRowSchema } from "./schema-row.schema";

const cuid = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

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
});

describe("reorderSchemaRowsRequestSchema", () => {
  it("accepts a payload carrying schemaId and orderedIds", () => {
    expect(
      reorderSchemaRowsRequestSchema.safeParse({ schemaId: cuid, orderedIds: [cuidB, cuidC] })
        .success,
    ).toBe(true);
  });

  it("rejects a payload missing schemaId", () => {
    expect(reorderSchemaRowsRequestSchema.safeParse({ orderedIds: [cuidB, cuidC] }).success).toBe(
      false,
    );
  });

  it("rejects a non-cuid schemaId", () => {
    expect(
      reorderSchemaRowsRequestSchema.safeParse({ schemaId: "not-a-cuid", orderedIds: [cuidB] })
        .success,
    ).toBe(false);
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
