import { describe, expect, it } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { buildRowGroupCreateRequest } from "./build-row-group-create-request";

const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeRow = (id: string, order: number): SchemaRow => ({
  id,
  schemaId: SCHEMA_ID,
  order,
  exerciseId: EXERCISE_ID,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  intensity: null,
  rest: null,
  modifiers: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const R1 = "clp9z8x7w0000abcd12rg1r001";
const R2 = "clp9z8x7w0000abcd12rg1r002";
const R3 = "clp9z8x7w0000abcd12rg1r003";

describe("buildRowGroupCreateRequest", () => {
  it("builds a request with the rowIds sorted by order for a contiguous run", () => {
    const result = buildRowGroupCreateRequest(
      [makeRow(R2, 2), makeRow(R1, 1)],
      new Set([R1, R2]),
      SCHEMA_ID,
    );

    expect(result).toStrictEqual({
      ok: true,
      request: { schemaId: SCHEMA_ID, rowIds: [R1, R2], notes: null },
    });
  });

  it("carries notes onto the request when provided", () => {
    const result = buildRowGroupCreateRequest(
      [makeRow(R1, 1), makeRow(R2, 2)],
      new Set([R1, R2]),
      SCHEMA_ID,
      ["OR"],
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.request.notes).toEqual(["OR"]);
    }
  });

  it("fails with the coach message when an unselected row sits between the selection", () => {
    const result = buildRowGroupCreateRequest(
      [makeRow(R1, 1), makeRow(R2, 2), makeRow(R3, 3)],
      new Set([R1, R3]),
      SCHEMA_ID,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toBe("Selected rows must be next to each other");
    }
  });

  it("succeeds for two adjacent rows whose order has a gap from a prior deletion", () => {
    const result = buildRowGroupCreateRequest(
      [makeRow(R1, 1), makeRow(R3, 3)],
      new Set([R1, R3]),
      SCHEMA_ID,
    );

    expect(result).toStrictEqual({
      ok: true,
      request: { schemaId: SCHEMA_ID, rowIds: [R1, R3], notes: null },
    });
  });

  it("fails when fewer than two rows are selected", () => {
    const result = buildRowGroupCreateRequest([makeRow(R1, 1)], new Set([R1]), SCHEMA_ID);

    expect(result.ok).toBe(false);
  });
});
