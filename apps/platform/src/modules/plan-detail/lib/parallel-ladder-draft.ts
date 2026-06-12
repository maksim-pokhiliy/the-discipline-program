import type {
  GroupDraft,
  NodeId,
  SchemaDraft,
  TrackDraft,
} from "../components/axes/axis-draft.types";

import { makeNodeId } from "./axis-draft-id";

export const MIN_TRACKS_FOR_PARALLEL = 2;

export const DEFAULT_SECOND_LADDER_STEPS = [15, 12, 9];

const ladderSteps = (schema: SchemaDraft): number[] =>
  schema.repetition?.kind === "ladder" ? schema.repetition.steps : [];

const ladderTrack = (id: NodeId, steps: number[]): TrackDraft => ({
  id,
  header: null,
  steps: [...steps],
});

export const hasParallelTracks = (group: GroupDraft): boolean =>
  group.tracks.length >= MIN_TRACKS_FOR_PARALLEL;

export const materializeParallel = (
  single: SchemaDraft,
  makeId: () => NodeId = makeNodeId,
): GroupDraft => ({
  id: single.id,
  header: null,
  tracks: [
    ladderTrack(makeId(), ladderSteps(single)),
    ladderTrack(makeId(), DEFAULT_SECOND_LADDER_STEPS),
  ],
});

export const appendTrack = (group: GroupDraft, makeId: () => NodeId = makeNodeId): GroupDraft => ({
  ...group,
  tracks: [...group.tracks, ladderTrack(makeId(), DEFAULT_SECOND_LADDER_STEPS)],
});

export const dematerializeToFlat = (group: GroupDraft): SchemaDraft | GroupDraft => {
  const [survivor] = group.tracks;

  if (group.tracks.length !== 1 || survivor === undefined) {
    return group;
  }

  return {
    id: group.id,
    header: group.header,
    notes: null,
    repetition: { kind: "ladder", steps: [...survivor.steps] },
    rows: [],
  };
};
