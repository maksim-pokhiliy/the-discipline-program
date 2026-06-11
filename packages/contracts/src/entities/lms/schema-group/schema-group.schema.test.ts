import { describe, expect, it } from "vitest";

import { SCHEMA_CONSTANTS } from "../schema";

import {
  createGroupRequestSchema,
  groupTrackSchema,
  schemaGroupSchema,
  updateGroupRequestSchema,
} from "./schema-group.schema";

const cuidA = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";

const baseGroup = {
  id: cuidA,
  blockId: cuidB,
  label: "parallel ladders",
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

  it("accepts a null label", () => {
    expect(schemaGroupSchema.safeParse({ ...baseGroup, label: null }).success).toBe(true);
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

  it("rejects a label over MAX_HEADER_LENGTH", () => {
    expect(
      schemaGroupSchema.safeParse({
        ...baseGroup,
        label: "x".repeat(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});

describe("groupTrackSchema", () => {
  it("accepts a track with steps within bounds", () => {
    expect(groupTrackSchema.safeParse({ header: "A", steps: [21, 15, 9] }).success).toBe(true);
  });

  it("rejects a track with empty steps", () => {
    expect(groupTrackSchema.safeParse({ steps: [] }).success).toBe(false);
  });

  it("rejects an unknown track key (strict)", () => {
    expect(groupTrackSchema.safeParse({ steps: [21], composition: {} }).success).toBe(false);
  });
});

describe("createGroupRequestSchema", () => {
  const baseRequest = {
    blockId: cuidB,
    tracks: [{ steps: [21, 15, 9] }, { steps: [15, 12, 9] }],
  };

  const makeTracks = (count: number) => Array.from({ length: count }, () => ({ steps: [21] }));

  const makeSteps = (length: number) => Array.from({ length }, () => 1);

  it("accepts a minimal two-track payload", () => {
    expect(createGroupRequestSchema.safeParse(baseRequest).success).toBe(true);
  });

  it("accepts an optional label + interleaveOrder", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        label: "parallel ladders",
        interleaveOrder: "track_by_track",
      }).success,
    ).toBe(true);
  });

  it("rejects a single-track payload (min 2)", () => {
    expect(
      createGroupRequestSchema.safeParse({ ...baseRequest, tracks: [{ steps: [21, 15, 9] }] })
        .success,
    ).toBe(false);
  });

  it("rejects an empty tracks array (min 2)", () => {
    expect(createGroupRequestSchema.safeParse({ ...baseRequest, tracks: [] }).success).toBe(false);
  });

  it("accepts the maximum allowed tracks count", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        tracks: makeTracks(SCHEMA_CONSTANTS.MAX_PARALLEL_TRACKS),
      }).success,
    ).toBe(true);
  });

  it("rejects one track over the maximum", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        tracks: makeTracks(SCHEMA_CONSTANTS.MAX_PARALLEL_TRACKS + 1),
      }).success,
    ).toBe(false);
  });

  it("accepts a track at the maximum allowed steps length", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        tracks: [{ steps: makeSteps(SCHEMA_CONSTANTS.MAX_LADDER_STEPS) }, { steps: [15, 12, 9] }],
      }).success,
    ).toBe(true);
  });

  it("rejects a track one step over the maximum length", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        tracks: [
          { steps: makeSteps(SCHEMA_CONSTANTS.MAX_LADDER_STEPS + 1) },
          { steps: [15, 12, 9] },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts a step at the maximum allowed value", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        tracks: [{ steps: [SCHEMA_CONSTANTS.MAX_LADDER_STEP_VALUE] }, { steps: [15, 12, 9] }],
      }).success,
    ).toBe(true);
  });

  it("rejects a step over the maximum value", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        tracks: [{ steps: [SCHEMA_CONSTANTS.MAX_LADDER_STEP_VALUE + 1] }, { steps: [15, 12, 9] }],
      }).success,
    ).toBe(false);
  });

  it("rejects a non-positive step", () => {
    expect(
      createGroupRequestSchema.safeParse({
        ...baseRequest,
        tracks: [{ steps: [21, 15, 9] }, { steps: [15, 0, 9] }],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown root key (strict)", () => {
    expect(createGroupRequestSchema.safeParse({ ...baseRequest, composition: {} }).success).toBe(
      false,
    );
  });

  it("rejects a non-cuid blockId", () => {
    expect(
      createGroupRequestSchema.safeParse({ ...baseRequest, blockId: "not-a-cuid" }).success,
    ).toBe(false);
  });
});

describe("updateGroupRequestSchema", () => {
  it("accepts an empty object (no-op)", () => {
    expect(updateGroupRequestSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a label-only update", () => {
    expect(updateGroupRequestSchema.safeParse({ label: "renamed" }).success).toBe(true);
  });

  it("accepts a null label (clear)", () => {
    expect(updateGroupRequestSchema.safeParse({ label: null }).success).toBe(true);
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
