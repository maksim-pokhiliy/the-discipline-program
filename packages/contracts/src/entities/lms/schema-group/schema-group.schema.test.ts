import { describe, expect, it } from "vitest";

import { SCHEMA_CONSTANTS } from "../schema";

import {
  createGroupRequestSchema,
  schemaGroupSchema,
  updateGroupRequestSchema,
} from "./schema-group.schema";

const cuidA = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

const baseGroup = {
  id: cuidA,
  blockId: cuidB,
  notes: ["parallel ladders"],
  interleaveOrder: "round_by_round" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("schemaGroupSchema", () => {
  it("round-trips a fully-populated group", () => {
    const result = schemaGroupSchema.safeParse(baseGroup);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(cuidA);
      expect(result.data.interleaveOrder).toBe("round_by_round");
    }
  });

  it("accepts null notes", () => {
    expect(schemaGroupSchema.safeParse({ ...baseGroup, notes: null }).success).toBe(true);
  });

  it("strips the dropped label field (D-FLOORS — box label is now the first note)", () => {
    const result = schemaGroupSchema.safeParse({ ...baseGroup, label: "parallel ladders" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("label");
    }
  });

  it("accepts the track_by_track interleave order", () => {
    expect(
      schemaGroupSchema.safeParse({ ...baseGroup, interleaveOrder: "track_by_track" }).success,
    ).toBe(true);
  });

  it("rejects an unknown interleave order", () => {
    expect(schemaGroupSchema.safeParse({ ...baseGroup, interleaveOrder: "zigzag" }).success).toBe(
      false,
    );
  });

  it("rejects a non-cuid id", () => {
    expect(schemaGroupSchema.safeParse({ ...baseGroup, id: "not-a-cuid" }).success).toBe(false);
  });

  it("rejects a notes entry over NOTE_MAX_LENGTH", () => {
    expect(
      schemaGroupSchema.safeParse({
        ...baseGroup,
        notes: ["x".repeat(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH + 1)],
      }).success,
    ).toBe(false);
  });
});

describe("createGroupRequestSchema", () => {
  const baseRequest = {
    blockId: cuidB,
    schemaIds: [cuidA, cuidC],
  };

  const makeSchemaIds = (count: number) =>
    Array.from(
      { length: count },
      (_, index) => `clz123456789012345678${index.toString().padStart(4, "0")}`,
    );

  it("accepts a minimal two-schema wrap payload", () => {
    expect(createGroupRequestSchema.safeParse(baseRequest).success).toBe(true);
  });

  it("accepts optional notes + interleaveOrder", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        notes: ["parallel ladders"],
        interleaveOrder: "track_by_track",
      }).success,
    ).toBe(true);
  });

  it("accepts null notes", () => {
    expect(createGroupRequestSchema.safeParse({ ...baseRequest, notes: null }).success).toBe(true);
  });

  it("rejects a single-schema payload (min 2)", () => {
    expect(createGroupRequestSchema.safeParse({ ...baseRequest, schemaIds: [cuidA] }).success).toBe(
      false,
    );
  });

  it("rejects an empty schemaIds array (min 2)", () => {
    expect(createGroupRequestSchema.safeParse({ ...baseRequest, schemaIds: [] }).success).toBe(
      false,
    );
  });

  it("accepts the maximum allowed schemaIds count", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        schemaIds: makeSchemaIds(SCHEMA_CONSTANTS.MAX_PARALLEL_TRACKS),
      }).success,
    ).toBe(true);
  });

  it("rejects one schemaId over the maximum", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        schemaIds: makeSchemaIds(SCHEMA_CONSTANTS.MAX_PARALLEL_TRACKS + 1),
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate schemaIds (unique refine)", () => {
    expect(
      createGroupRequestSchema.safeParse({ ...baseRequest, schemaIds: [cuidA, cuidA] }).success,
    ).toBe(false);
  });

  it("rejects a non-cuid schemaId", () => {
    expect(
      createGroupRequestSchema.safeParse({ ...baseRequest, schemaIds: [cuidA, "not-a-cuid"] })
        .success,
    ).toBe(false);
  });

  it("rejects a non-cuid blockId", () => {
    expect(
      createGroupRequestSchema.safeParse({ ...baseRequest, blockId: "not-a-cuid" }).success,
    ).toBe(false);
  });

  it("rejects an unknown root key (strict)", () => {
    expect(createGroupRequestSchema.safeParse({ ...baseRequest, tracks: [] }).success).toBe(false);
  });
});

describe("updateGroupRequestSchema", () => {
  it("accepts an empty object (no-op)", () => {
    expect(updateGroupRequestSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a notes-only update", () => {
    expect(updateGroupRequestSchema.safeParse({ notes: ["renamed"] }).success).toBe(true);
  });

  it("accepts null notes (clear)", () => {
    expect(updateGroupRequestSchema.safeParse({ notes: null }).success).toBe(true);
  });

  it("accepts an interleaveOrder-only update", () => {
    expect(updateGroupRequestSchema.safeParse({ interleaveOrder: "track_by_track" }).success).toBe(
      true,
    );
  });

  it("rejects an unknown key (strict)", () => {
    expect(updateGroupRequestSchema.safeParse({ blockId: cuidB }).success).toBe(false);
  });
});
