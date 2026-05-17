import { describe, expect, it } from "vitest";

import {
  assignBlockLabelsRequestSchema,
  assignBlockLabelsResponseSchema,
  blockByIdParamsSchema,
  blockBySessionParamsSchema,
  createBlockRequestSchema,
  createBlockResponseSchema,
  reorderBlocksRequestSchema,
  reorderBlocksResponseSchema,
  updateBlockRequestSchema,
  updateBlockResponseSchema,
} from "./block-api.schema";
import {
  assignBlockLabelsSchema,
  blockSchema,
  createBlockSchema,
  reorderBlocksSchema,
  updateBlockSchema,
} from "./block.schema";

const planId = "clz1234567890123456789012";
const sessionId = "clz1234567890123456789aaa";
const blockId = "clz1234567890123456789bbb";

describe("blockBySessionParamsSchema", () => {
  it("accepts two cuids", () => {
    const result = blockBySessionParamsSchema.safeParse({ planId, sessionId });

    expect(result.success).toBe(true);
  });

  it("rejects a non-cuid planId", () => {
    const result = blockBySessionParamsSchema.safeParse({
      planId: "not-a-cuid",
      sessionId,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-cuid sessionId", () => {
    const result = blockBySessionParamsSchema.safeParse({
      planId,
      sessionId: "not-a-cuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing sessionId", () => {
    const result = blockBySessionParamsSchema.safeParse({ planId });

    expect(result.success).toBe(false);
  });
});

describe("blockByIdParamsSchema", () => {
  it("accepts two cuids", () => {
    const result = blockByIdParamsSchema.safeParse({ planId, blockId });

    expect(result.success).toBe(true);
  });

  it("rejects a non-cuid blockId", () => {
    const result = blockByIdParamsSchema.safeParse({
      planId,
      blockId: "not-a-cuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing blockId", () => {
    const result = blockByIdParamsSchema.safeParse({ planId });

    expect(result.success).toBe(false);
  });
});

describe("request/response wrapper aliases", () => {
  it("createBlockRequestSchema is createBlockSchema", () => {
    expect(createBlockRequestSchema).toBe(createBlockSchema);
  });

  it("createBlockResponseSchema is blockSchema", () => {
    expect(createBlockResponseSchema).toBe(blockSchema);
  });

  it("updateBlockRequestSchema is updateBlockSchema", () => {
    expect(updateBlockRequestSchema).toBe(updateBlockSchema);
  });

  it("updateBlockResponseSchema is blockSchema", () => {
    expect(updateBlockResponseSchema).toBe(blockSchema);
  });

  it("reorderBlocksRequestSchema is reorderBlocksSchema", () => {
    expect(reorderBlocksRequestSchema).toBe(reorderBlocksSchema);
  });

  it("assignBlockLabelsRequestSchema is assignBlockLabelsSchema", () => {
    expect(assignBlockLabelsRequestSchema).toBe(assignBlockLabelsSchema);
  });

  it("assignBlockLabelsResponseSchema is blockSchema", () => {
    expect(assignBlockLabelsResponseSchema).toBe(blockSchema);
  });
});

describe("reorderBlocksResponseSchema", () => {
  it("accepts a wrapper { blocks: [] }", () => {
    const result = reorderBlocksResponseSchema.safeParse({ blocks: [] });

    expect(result.success).toBe(true);
  });

  it("rejects a bare array", () => {
    const result = reorderBlocksResponseSchema.safeParse([]);

    expect(result.success).toBe(false);
  });
});
