import { describe, expect, it } from "vitest";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { buildSchemaGroupCreateRequest } from "./build-schema-group-create-request";

const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const S1 = "clp9z8x7w0000abcd12sg1s001";
const S2 = "clp9z8x7w0000abcd12sg1s002";
const S3 = "clp9z8x7w0000abcd12sg1s003";

const makeSchema = (id: string, order: number): SchemaWithBody => ({
  schema: {
    id,
    blockId: BLOCK_ID,
    groupId: null,
    order,
    header: null,
    intensity: null,
    composition: null,
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  rows: [],
  rowGroups: [],
});

describe("buildSchemaGroupCreateRequest", () => {
  it("builds a request with the schemaIds sorted by order for a contiguous run", () => {
    const result = buildSchemaGroupCreateRequest(
      [makeSchema(S2, 2), makeSchema(S1, 1)],
      new Set([S1, S2]),
      BLOCK_ID,
    );

    expect(result).toStrictEqual({
      ok: true,
      request: { blockId: BLOCK_ID, schemaIds: [S1, S2], notes: null },
    });
  });

  it("carries notes onto the request when provided", () => {
    const result = buildSchemaGroupCreateRequest(
      [makeSchema(S1, 1), makeSchema(S2, 2)],
      new Set([S1, S2]),
      BLOCK_ID,
      ["AMRAP pairing"],
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.request.notes).toEqual(["AMRAP pairing"]);
    }
  });

  it("succeeds for two adjacent schemas whose order has a gap from a prior deletion", () => {
    const result = buildSchemaGroupCreateRequest(
      [makeSchema(S1, 1), makeSchema(S3, 5)],
      new Set([S1, S3]),
      BLOCK_ID,
    );

    expect(result).toStrictEqual({
      ok: true,
      request: { blockId: BLOCK_ID, schemaIds: [S1, S3], notes: null },
    });
  });

  it("fails with the coach message when an unselected schema sits between the selection", () => {
    const result = buildSchemaGroupCreateRequest(
      [makeSchema(S1, 1), makeSchema(S2, 2), makeSchema(S3, 3)],
      new Set([S1, S3]),
      BLOCK_ID,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toBe("Selected schemas must be next to each other");
    }
  });

  it("fails when fewer than two schemas are selected (zod min(2) owns the message)", () => {
    const result = buildSchemaGroupCreateRequest(
      [makeSchema(S1, 1), makeSchema(S2, 2)],
      new Set([S1]),
      BLOCK_ID,
    );

    expect(result.ok).toBe(false);
  });
});
