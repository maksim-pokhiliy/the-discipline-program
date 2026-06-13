import { describe, expect, it } from "vitest";

import { ROW_GROUP_CONSTANTS } from "./row-group.constants";
import {
  createRowGroupRequestSchema,
  rowGroupSchema,
  updateRowGroupRequestSchema,
} from "./row-group.schema";

const cuidA = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

const baseRowGroup = {
  id: cuidA,
  schemaId: cuidB,
  notes: ["OR"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("rowGroupSchema", () => {
  it("round-trips a fully-populated row-group", () => {
    const result = rowGroupSchema.safeParse(baseRowGroup);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.schemaId).toBe(cuidB);
    }
  });

  it("accepts null notes", () => {
    expect(rowGroupSchema.safeParse({ ...baseRowGroup, notes: null }).success).toBe(true);
  });

  it("rejects a non-cuid id", () => {
    expect(rowGroupSchema.safeParse({ ...baseRowGroup, id: "not-a-cuid" }).success).toBe(false);
  });

  it("does not expose a label or interleaveOrder (one floor down from SchemaGroup)", () => {
    expect(rowGroupSchema.shape).not.toHaveProperty("label");
    expect(rowGroupSchema.shape).not.toHaveProperty("interleaveOrder");
  });
});

describe("createRowGroupRequestSchema", () => {
  const baseRequest = {
    schemaId: cuidB,
    rowIds: [cuidA, cuidC],
  };

  it("accepts a minimal two-row wrap", () => {
    expect(createRowGroupRequestSchema.safeParse(baseRequest).success).toBe(true);
  });

  it("accepts an optional notes list", () => {
    expect(createRowGroupRequestSchema.safeParse({ ...baseRequest, notes: ["OR"] }).success).toBe(
      true,
    );
  });

  it("rejects a single-row wrap (min 2)", () => {
    expect(createRowGroupRequestSchema.safeParse({ ...baseRequest, rowIds: [cuidA] }).success).toBe(
      false,
    );
  });

  it("rejects an empty rowIds array (min 2)", () => {
    expect(createRowGroupRequestSchema.safeParse({ ...baseRequest, rowIds: [] }).success).toBe(
      false,
    );
  });

  it("rejects more rows than the cap", () => {
    const tooMany = Array.from(
      { length: ROW_GROUP_CONSTANTS.MAX_ROWS_PER_GROUP + 1 },
      (_, i) => `clz123456789012345678${i.toString().padStart(4, "x")}`,
    );

    expect(createRowGroupRequestSchema.safeParse({ ...baseRequest, rowIds: tooMany }).success).toBe(
      false,
    );
  });

  it("rejects a non-cuid rowId", () => {
    expect(
      createRowGroupRequestSchema.safeParse({ ...baseRequest, rowIds: [cuidA, "not-a-cuid"] })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown root key (strict)", () => {
    expect(
      createRowGroupRequestSchema.safeParse({ ...baseRequest, interleaveOrder: "round_by_round" })
        .success,
    ).toBe(false);
  });
});

describe("updateRowGroupRequestSchema", () => {
  it("accepts an empty object (no-op)", () => {
    expect(updateRowGroupRequestSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a notes-only update", () => {
    expect(updateRowGroupRequestSchema.safeParse({ notes: ["renamed"] }).success).toBe(true);
  });

  it("accepts null notes (clear)", () => {
    expect(updateRowGroupRequestSchema.safeParse({ notes: null }).success).toBe(true);
  });

  it("rejects an unknown key (strict)", () => {
    expect(updateRowGroupRequestSchema.safeParse({ schemaId: cuidB }).success).toBe(false);
  });
});
