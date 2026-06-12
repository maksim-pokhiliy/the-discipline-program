import { describe, expect, it } from "vitest";

import type { GroupDraft, NodeId, SchemaDraft } from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";
import {
  appendTrack,
  DEFAULT_SECOND_LADDER_STEPS,
  dematerializeToFlat,
  hasParallelTracks,
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

const flatLadder = (steps: number[]): SchemaDraft => ({
  id: SINGLE_ID,
  header: null,
  notes: null,
  repetition: { kind: "ladder", steps },
  rows: [],
});

const oneTrackGroup = (group: GroupDraft): GroupDraft => ({
  ...group,
  tracks: group.tracks.slice(0, 1),
});

describe("hasParallelTracks", () => {
  it("returns false for a single-track group (never auto-wrapped)", () => {
    expect(
      hasParallelTracks(oneTrackGroup(materializeParallel(flatLadder(FIRST_LADDER_STEPS)))),
    ).toBe(false);
  });

  it("returns true once two tracks are present", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(hasParallelTracks(parent)).toBe(true);
  });
});

describe("materializeParallel", () => {
  it("produces a parallel group with exactly two tracks", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(hasParallelTracks(parent)).toBe(true);
    expect(parent.tracks).toHaveLength(2);
  });

  it("reuses the original single's id on the group", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(parent.id).toBe(SINGLE_ID);
  });

  it("carries a null header and no axes on the group", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(parent.header).toBeNull();
    expect(parent).not.toHaveProperty("repetition");
    expect(parent).not.toHaveProperty("rest");
  });

  it("preserves track-1 ladder steps and defaults track-2 steps", () => {
    const [track1, track2] = materializeParallel(
      flatLadder(FIRST_LADDER_STEPS),
      sequentialIds("t1", "t2"),
    ).tracks;

    expect(track1?.steps).toEqual(FIRST_LADDER_STEPS);
    expect(track2?.steps).toEqual(DEFAULT_SECOND_LADDER_STEPS);
  });

  it("gives both tracks fresh ids distinct from the group and each other", () => {
    const [track1, track2] = materializeParallel(
      flatLadder(FIRST_LADDER_STEPS),
      sequentialIds("t1", "t2"),
    ).tracks;

    expect(track1?.id).toBe(asNodeId("t1"));
    expect(track2?.id).toBe(asNodeId("t2"));
    expect(track1?.id).not.toBe(SINGLE_ID);
    expect(track2?.id).not.toBe(SINGLE_ID);
    expect(track1?.id).not.toBe(track2?.id);
  });

  it("defaults track-1 steps to empty when the single has no ladder repetition", () => {
    const bare: SchemaDraft = {
      id: SINGLE_ID,
      header: null,
      notes: null,
      rows: [],
    };
    const [track1] = materializeParallel(bare, sequentialIds("t1", "t2")).tracks;

    expect(track1?.steps).toEqual([]);
  });

  it("does not alias the single's steps array into track 1", () => {
    const steps = [21, 15, 9];
    const [track1] = materializeParallel(flatLadder(steps), sequentialIds("t1", "t2")).tracks;

    steps.push(3);

    expect(track1?.steps).toEqual([21, 15, 9]);
  });
});

describe("appendTrack", () => {
  it("appends one fresh ladder track and increments the track count by one", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));
    const grown = appendTrack(parent, sequentialIds("t3"));

    expect(grown.tracks).toHaveLength(3);
    expect(grown.tracks[2]?.id).toBe(asNodeId("t3"));
    expect(grown.tracks[2]?.steps).toEqual(DEFAULT_SECOND_LADDER_STEPS);
  });
});

describe("dematerializeToFlat", () => {
  it("collapses a single-track group back to a flat ladder keeping the group id", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));
    const survivorOnly: GroupDraft = { ...parent, tracks: parent.tracks.slice(0, 1) };
    const flat = dematerializeToFlat(survivorOnly);

    expect(flat).not.toHaveProperty("tracks");
    expect(flat.id).toBe(SINGLE_ID);

    if ("rows" in flat) {
      expect(flat.rows).toEqual([]);
      expect(flat.repetition).toEqual({ kind: "ladder", steps: FIRST_LADDER_STEPS });
    }
  });

  it("round-trips materialize then remove-to-one back to the survivor steps", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));
    const keepSecond: GroupDraft = { ...parent, tracks: parent.tracks.slice(1) };
    const flat = dematerializeToFlat(keepSecond);

    if ("rows" in flat) {
      expect(flat.repetition).toEqual({ kind: "ladder", steps: DEFAULT_SECOND_LADDER_STEPS });
    }
  });

  it("returns the group unchanged when it has more than one track", () => {
    const parent = materializeParallel(flatLadder(FIRST_LADDER_STEPS), sequentialIds("t1", "t2"));

    expect(dematerializeToFlat(parent)).toBe(parent);
  });

  it("returns the group unchanged when it has zero tracks", () => {
    const parent: GroupDraft = { id: SINGLE_ID, header: null, tracks: [] };

    expect(dematerializeToFlat(parent)).toBe(parent);
  });
});
