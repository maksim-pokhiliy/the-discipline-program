import { describe, expect, it } from "vitest";

import { SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";

import type { ComposeContainer, ComposeNode } from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";
import { buildParallelCreateRequest } from "./build-parallel-schemas";

const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const PARENT_SCHEMA_ID = "clp9z8x7w0000abcd1234par1";

const ladderTrack = (id: string, steps: number[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(id),
  header: null,
  notes: null,
  repetition: { kind: "ladder", steps },
  children: [],
});

const parent = (children: ComposeNode[], header: string | null = null): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("parent-1"),
  header,
  notes: null,
  children,
});

describe("buildParallelCreateRequest", () => {
  it("builds a single request with per-track steps for a valid 2-track draft", () => {
    const result = buildParallelCreateRequest(
      parent([ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [15, 12, 9])]),
      BLOCK_ID,
    );

    expect(result).toStrictEqual({
      ok: true,
      request: {
        blockId: BLOCK_ID,
        header: null,
        tracks: [
          { header: null, steps: [21, 15, 9] },
          { header: null, steps: [15, 12, 9] },
        ],
      },
    });
  });

  it("preserves draft order as request order across more than two tracks", () => {
    const result = buildParallelCreateRequest(
      parent([ladderTrack("t1", [5]), ladderTrack("t2", [10]), ladderTrack("t3", [15])]),
      BLOCK_ID,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.request.tracks.map((track) => track.steps)).toEqual([[5], [10], [15]]);
    }
  });

  it("carries the parent header and each track's header onto the request", () => {
    const result = buildParallelCreateRequest(
      parent(
        [ladderTrack("t1", [21, 15, 9]), { ...ladderTrack("t2", [15, 12, 9]), header: "B" }],
        "parent header",
      ),
      BLOCK_ID,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.request.header).toBe("parent header");
      expect(result.request.tracks.map((track) => track.header)).toEqual([null, "B"]);
    }
  });

  it("includes parentSchemaId only when provided", () => {
    const children = (): ComposeNode[] => [ladderTrack("t1", [21]), ladderTrack("t2", [15])];

    const nested = buildParallelCreateRequest(parent(children()), BLOCK_ID, PARENT_SCHEMA_ID);
    const topLevel = buildParallelCreateRequest(parent(children()), BLOCK_ID);

    expect(nested.ok).toBe(true);
    expect(topLevel.ok).toBe(true);

    if (nested.ok && topLevel.ok) {
      expect(nested.request.parentSchemaId).toBe(PARENT_SCHEMA_ID);
      expect("parentSchemaId" in topLevel.request).toBe(false);
    }
  });

  it("fails with coach copy naming the ladder when a track has zero steps", () => {
    const result = buildParallelCreateRequest(
      parent([ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [])]),
      BLOCK_ID,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatch(/^ladder 2 steps: /);
      expect(result.error).toMatch(/at least 1/i);
    }
  });

  it("fails with coach copy naming the ladder and step on a non-positive step", () => {
    const result = buildParallelCreateRequest(
      parent([ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [15, 0, 9])]),
      BLOCK_ID,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatch(/^ladder 2, step 2: /);
      expect(result.error).toMatch(/greater than 0/i);
    }
  });

  it("fails with coach copy naming the ladder name when a track header is too long", () => {
    const longHeader = "x".repeat(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH + 1);
    const result = buildParallelCreateRequest(
      parent([{ ...ladderTrack("t1", [21, 15, 9]), header: longHeader }, ladderTrack("t2", [15])]),
      BLOCK_ID,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatch(/^ladder 1 name: /);
      expect(result.error).toMatch(/at most/i);
    }
  });

  it("fails with coach copy before any request when the draft exceeds the track cap (QA-Must-9)", () => {
    const tracks = Array.from({ length: SCHEMA_CONSTANTS.MAX_PARALLEL_TRACKS + 1 }, (_, i) =>
      ladderTrack(`t${String(i + 1)}`, [21, 15, 9]),
    );
    const result = buildParallelCreateRequest(parent(tracks), BLOCK_ID);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatch(/^ladders: /);
      expect(result.error).toMatch(/at most/i);
    }
  });

  it("rejects a non-parallel single-track draft", () => {
    const result = buildParallelCreateRequest(parent([ladderTrack("t1", [21, 15, 9])]), BLOCK_ID);

    expect(result.ok).toBe(false);
  });

  it("rejects a flat draft with no container tracks", () => {
    const result = buildParallelCreateRequest(parent([]), BLOCK_ID);

    expect(result.ok).toBe(false);
  });
});
