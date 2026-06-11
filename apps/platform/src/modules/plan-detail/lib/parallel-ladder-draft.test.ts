import { describe, expect, it } from "vitest";

import type { ComposeContainer, NodeId } from "../components/axes/axis-draft.types";

import { collectTrackChildren } from "./arrangement-tree";
import { asNodeId } from "./axis-draft-id";
import {
  appendTrack,
  DEFAULT_SECOND_LADDER_STEPS,
  dematerializeToFlat,
  isParallelDraft,
  materializeParallel,
} from "./parallel-ladder-draft";

const SINGLE_ID = asNodeId("single-1");
const FIRST_LADDER_STEPS = [21, 15, 9];

const sequentialIds = (...raw: string[]): (() => NodeId) => {
  const queue = raw.map(asNodeId);
  let cursor = 0;

  return () => {
    const next = queue[cursor];

    if (next === undefined) {
      throw new Error("sequentialIds exhausted");
    }

    cursor += 1;

    return next;
  };
};

const flatLadder = (steps: number[]): ComposeContainer => ({
  nodeType: "container",
  id: SINGLE_ID,
  header: null,
  notes: null,
  repetition: { kind: "ladder", steps },
  children: [],
});

describe("isParallelDraft", () => {
  it("returns false for a single flat ladder (never auto-wrapped)", () => {
    expect(isParallelDraft(flatLadder(FIRST_LADDER_STEPS))).toBe(false);
  });

  it("returns true once two container tracks are present", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(isParallelDraft(parent)).toBe(true);
  });
});

describe("materializeParallel", () => {
  it("produces a parallel parent with exactly two container tracks", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(isParallelDraft(parent)).toBe(true);
    expect(collectTrackChildren(parent)).toHaveLength(2);
  });

  it("reuses the original single's id on the parent", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(parent.id).toBe(SINGLE_ID);
  });

  it("carries no repetition or rest on the parent", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(parent.repetition).toBeUndefined();
    expect(parent.rest).toBeUndefined();
  });

  it("preserves track-1 ladder steps and defaults track-2 steps", () => {
    const [track1, track2] = collectTrackChildren(
      materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2")),
    );

    expect(track1?.repetition).toEqual({ kind: "ladder", steps: FIRST_LADDER_STEPS });
    expect(track2?.repetition).toEqual({ kind: "ladder", steps: DEFAULT_SECOND_LADDER_STEPS });
  });

  it("gives both tracks fresh ids distinct from the parent and each other", () => {
    const [track1, track2] = collectTrackChildren(
      materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2")),
    );

    expect(track1?.id).toBe(asNodeId("t1"));
    expect(track2?.id).toBe(asNodeId("t2"));
    expect(track1?.id).not.toBe(SINGLE_ID);
    expect(track2?.id).not.toBe(SINGLE_ID);
    expect(track1?.id).not.toBe(track2?.id);
  });

  it("defaults track-1 steps to empty when the single has no ladder repetition", () => {
    const bare: ComposeContainer = {
      nodeType: "container",
      id: SINGLE_ID,
      header: null,
      notes: null,
      children: [],
    };
    const [track1] = collectTrackChildren(materializeParallel(bare, sequentialIds("t1", "t2")));

    expect(track1?.repetition).toEqual({ kind: "ladder", steps: [] });
  });

  it("does not alias the single's steps array into track 1", () => {
    const steps = [21, 15, 9];
    const [track1] = collectTrackChildren(
      materializeParallel(flatLadder(steps), sequentialIds("t1", "t2")),
    );

    steps.push(3);

    expect(track1?.repetition).toEqual({ kind: "ladder", steps: [21, 15, 9] });
  });
});

describe("appendTrack", () => {
  it("appends one fresh ladder track and increments the track count by one", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));
    const grown = appendTrack(parent, sequentialIds("t3"));
    const tracks = collectTrackChildren(grown);

    expect(tracks).toHaveLength(3);
    expect(tracks[2]?.id).toBe(asNodeId("t3"));
    expect(tracks[2]?.repetition).toEqual({ kind: "ladder", steps: DEFAULT_SECOND_LADDER_STEPS });
  });
});

describe("dematerializeToFlat", () => {
  it("collapses a single-track parent back to a flat ladder keeping the parent id", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));
    const survivorOnly: ComposeContainer = {
      ...parent,
      children: collectTrackChildren(parent).slice(0, 1),
    };
    const flat = dematerializeToFlat(survivorOnly);

    expect(isParallelDraft(flat)).toBe(false);
    expect(flat.id).toBe(SINGLE_ID);
    expect(flat.children).toEqual([]);
    expect(flat.repetition).toEqual({ kind: "ladder", steps: FIRST_LADDER_STEPS });
  });

  it("round-trips materialize then remove-to-one back to the survivor steps", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));
    const keepSecond: ComposeContainer = {
      ...parent,
      children: collectTrackChildren(parent).slice(1),
    };
    const flat = dematerializeToFlat(keepSecond);

    expect(flat.repetition).toEqual({ kind: "ladder", steps: DEFAULT_SECOND_LADDER_STEPS });
  });

  it("returns the parent unchanged when it has more than one container track", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(dematerializeToFlat(parent)).toBe(parent);
  });

  it("returns the parent unchanged when it has zero container tracks", () => {
    const parent: ComposeContainer = {
      nodeType: "container",
      id: SINGLE_ID,
      header: null,
      notes: null,
      children: [],
    };

    expect(dematerializeToFlat(parent)).toBe(parent);
  });
});
