import { describe, expect, it } from "vitest";

import {
  createParallelSchemasRequestSchema,
  createParallelSchemasResponseSchema,
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
  schemaSchema,
  schemaWithBodySchema,
  updateSchemaSchema,
} from "./schema.schema";

const cuid = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

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

  it("createParallelSchemasResponseSchema is schemaWithBodySchema", () => {
    expect(createParallelSchemasResponseSchema).toBe(schemaWithBodySchema);
  });
});

describe("createParallelSchemasRequestSchema", () => {
  const baseParallelPayload = {
    blockId: cuid,
    tracks: [{ steps: [21, 15, 9] }, { steps: [15, 12, 9] }],
  };

  it("accepts a minimal two-track payload", () => {
    expect(createParallelSchemasRequestSchema.safeParse(baseParallelPayload).success).toBe(true);
  });

  it("accepts parentSchemaId and nullable headers", () => {
    const r = createParallelSchemasRequestSchema.safeParse({
      ...baseParallelPayload,
      parentSchemaId: cuidB,
      header: null,
      tracks: [
        { header: "A", steps: [21, 15, 9] },
        { header: null, steps: [15, 12, 9] },
      ],
    });

    expect(r.success).toBe(true);
  });

  it("rejects a single-track payload", () => {
    const r = createParallelSchemasRequestSchema.safeParse({
      ...baseParallelPayload,
      tracks: [{ steps: [21, 15, 9] }],
    });

    expect(r.success).toBe(false);
  });

  it("rejects a track with empty steps", () => {
    const r = createParallelSchemasRequestSchema.safeParse({
      ...baseParallelPayload,
      tracks: [{ steps: [21, 15, 9] }, { steps: [] }],
    });

    expect(r.success).toBe(false);
  });

  it("rejects a non-positive step", () => {
    const r = createParallelSchemasRequestSchema.safeParse({
      ...baseParallelPayload,
      tracks: [{ steps: [21, 15, 9] }, { steps: [15, 0, 9] }],
    });

    expect(r.success).toBe(false);
  });

  it("rejects a non-integer step", () => {
    const r = createParallelSchemasRequestSchema.safeParse({
      ...baseParallelPayload,
      tracks: [{ steps: [21, 15, 9] }, { steps: [15, 1.5, 9] }],
    });

    expect(r.success).toBe(false);
  });

  it("rejects an unknown root key", () => {
    const r = createParallelSchemasRequestSchema.safeParse({
      ...baseParallelPayload,
      composition: {},
    });

    expect(r.success).toBe(false);
  });

  it("rejects an unknown track key", () => {
    const r = createParallelSchemasRequestSchema.safeParse({
      ...baseParallelPayload,
      tracks: [{ steps: [21, 15, 9] }, { steps: [15, 12, 9], composition: {} }],
    });

    expect(r.success).toBe(false);
  });

  it("rejects a non-cuid blockId", () => {
    const r = createParallelSchemasRequestSchema.safeParse({
      ...baseParallelPayload,
      blockId: "not-a-cuid",
    });

    expect(r.success).toBe(false);
  });
});

describe("reorderSchemasRequestSchema", () => {
  it("accepts a block-scoped payload", () => {
    expect(
      reorderSchemasRequestSchema.safeParse({ blockId: cuid, orderedIds: [cuidB, cuidC] }).success,
    ).toBe(true);
  });

  it("accepts a parent-schema-scoped payload", () => {
    expect(
      reorderSchemasRequestSchema.safeParse({ parentSchemaId: cuid, orderedIds: [cuidB, cuidC] })
        .success,
    ).toBe(true);
  });

  it("rejects a payload carrying both scope keys", () => {
    expect(
      reorderSchemasRequestSchema.safeParse({
        blockId: cuid,
        parentSchemaId: cuidB,
        orderedIds: [cuidC],
      }).success,
    ).toBe(false);
  });

  it("rejects a payload carrying neither scope key", () => {
    expect(reorderSchemasRequestSchema.safeParse({ orderedIds: [cuidB, cuidC] }).success).toBe(
      false,
    );
  });

  it("rejects an explicit parentSchemaId null (MT-5)", () => {
    expect(
      reorderSchemasRequestSchema.safeParse({
        blockId: cuid,
        parentSchemaId: null,
        orderedIds: [cuidB, cuidC],
      }).success,
    ).toBe(false);
  });

  it("rejects an empty orderedIds array (MT-6)", () => {
    expect(reorderSchemasRequestSchema.safeParse({ blockId: cuid, orderedIds: [] }).success).toBe(
      false,
    );
  });

  it("rejects orderedIds with duplicate ids (MT-7)", () => {
    expect(
      reorderSchemasRequestSchema.safeParse({ blockId: cuid, orderedIds: [cuidB, cuidB] }).success,
    ).toBe(false);
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
