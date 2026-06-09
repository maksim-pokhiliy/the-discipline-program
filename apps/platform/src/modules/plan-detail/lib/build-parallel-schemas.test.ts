import { describe, expect, it } from "vitest";

import type { ComposeContainer, ComposeNode } from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";
import { buildParallelCreateSequence } from "./build-parallel-schemas";

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

describe("buildParallelCreateSequence", () => {
  it("builds both ladder compositions with an empty parent composition for a valid 2-track draft", () => {
    const result = buildParallelCreateSequence(
      parent([ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [15, 12, 9])]),
    );

    expect(result).toEqual({
      ok: true,
      parentComposition: {},
      parentHeader: null,
      tracks: [
        { composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } }, header: null },
        { composition: { repetition: { kind: "ladder", steps: [15, 12, 9] } }, header: null },
      ],
    });
  });

  it("preserves draft order as persist order across more than two tracks", () => {
    const result = buildParallelCreateSequence(
      parent([ladderTrack("t1", [5]), ladderTrack("t2", [10]), ladderTrack("t3", [15])]),
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.tracks.map((track) => track.composition)).toEqual([
        { repetition: { kind: "ladder", steps: [5] } },
        { repetition: { kind: "ladder", steps: [10] } },
        { repetition: { kind: "ladder", steps: [15] } },
      ]);
    }
  });

  it("carries each track's header onto its descriptor", () => {
    const result = buildParallelCreateSequence(
      parent(
        [ladderTrack("t1", [21, 15, 9]), { ...ladderTrack("t2", [15, 12, 9]), header: "B" }],
        "parent header",
      ),
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.parentHeader).toBe("parent header");
      expect(result.tracks.map((track) => track.header)).toEqual([null, "B"]);
    }
  });

  it("fails on the first track that carries a non-positive step", () => {
    const result = buildParallelCreateSequence(
      parent([ladderTrack("t1", [21, 15, 9]), ladderTrack("t2", [15, 0, 9])]),
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatch(/ladder 2/);
      expect(result.error).toMatch(/positive|greater than 0/i);
    }
  });

  it("rejects a non-parallel single-track draft", () => {
    const result = buildParallelCreateSequence(parent([ladderTrack("t1", [21, 15, 9])]));

    expect(result.ok).toBe(false);
  });

  it("rejects a flat draft with no container tracks", () => {
    const result = buildParallelCreateSequence(parent([]));

    expect(result.ok).toBe(false);
  });
});
