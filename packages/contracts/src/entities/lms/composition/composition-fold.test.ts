import { describe, expect, it } from "vitest";

import { schemaRowPayloadSchema } from "../schema-row";

import { arrangementAxisSchema, parallelTrackSchema } from "./composition.schema";

const cuidTrackA = "clz0000000000000000trackaa";
const cuidTrackB = "clz0000000000000000trackbb";
const cuidLadderChild = "clz000000000000000ladderch";
const cuidStepsRow = "clz0000000000000000stepsrw";
const cuidPairedRow = "clz000000000000000pairedrw";

describe("AlternatingGroup → arrangement:parallel fold target (design §9)", () => {
  it("absorbs block-009 setEnumeration onto each track without loss", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [
          { childSchemaId: cuidTrackA, setEnumeration: [1, 2, 3, 4, 5] },
          { childSchemaId: cuidTrackB, setEnumeration: [1, 2, 3, 4, 5] },
        ],
      }).success,
    ).toBe(true);
  });

  it("absorbs pairedWithInnerRowId as pairedWithRowId on the track", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [
          { childSchemaId: cuidTrackA, pairedWithRowId: cuidPairedRow },
          { childSchemaId: cuidTrackB },
        ],
      }).success,
    ).toBe(true);
  });

  it("keeps parallel-ladder per-track steps on a referenced INNER_LADDER_MARKER row, not the track", () => {
    const track = parallelTrackSchema.parse({
      childSchemaId: cuidLadderChild,
      pairedWithRowId: cuidStepsRow,
    });

    expect(track).not.toHaveProperty("steps");
    expect(track).not.toHaveProperty("direction");

    expect(
      schemaRowPayloadSchema.safeParse({ rowKind: "INNER_LADDER_MARKER", steps: [21, 15, 9] })
        .success,
    ).toBe(true);
  });

  it("rejects steps/direction supplied on a track (direction is derived, never stored)", () => {
    expect(
      parallelTrackSchema.safeParse({
        childSchemaId: cuidLadderChild,
        steps: [21, 15, 9],
        direction: "desc",
      }).success,
    ).toBe(false);
  });

  it("rejects the legacy pairedWithInnerRowId field name (guards the §5 rename slip)", () => {
    expect(
      parallelTrackSchema.safeParse({
        childSchemaId: cuidLadderChild,
        pairedWithInnerRowId: cuidPairedRow,
      }).success,
    ).toBe(false);
  });
});
