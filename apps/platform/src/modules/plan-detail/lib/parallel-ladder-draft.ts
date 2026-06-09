import type { ComposeContainer, NodeId } from "../components/axes/axis-draft.types";

import { collectTrackChildren } from "./arrangement-tree";
import { makeNodeId } from "./axis-draft-id";

export const MIN_TRACKS_FOR_PARALLEL = 2;

export const DEFAULT_SECOND_LADDER_STEPS = [15, 12, 9];

const ladderSteps = (container: ComposeContainer): number[] =>
  container.repetition?.kind === "ladder" ? container.repetition.steps : [];

const ladderTrack = (id: NodeId, steps: number[]): ComposeContainer => ({
  nodeType: "container",
  id,
  header: null,
  notes: null,
  repetition: { kind: "ladder", steps: [...steps] },
  children: [],
});

export const isParallelDraft = (container: ComposeContainer): boolean =>
  collectTrackChildren(container).length >= MIN_TRACKS_FOR_PARALLEL;

export const materializeParallel = (
  single: ComposeContainer,
  makeId: () => NodeId = makeNodeId,
): ComposeContainer => ({
  nodeType: "container",
  id: single.id,
  header: null,
  notes: null,
  children: [
    ladderTrack(makeId(), ladderSteps(single)),
    ladderTrack(makeId(), DEFAULT_SECOND_LADDER_STEPS),
  ],
});

export const appendTrack = (
  parent: ComposeContainer,
  makeId: () => NodeId = makeNodeId,
): ComposeContainer => ({
  ...parent,
  children: [...parent.children, ladderTrack(makeId(), DEFAULT_SECOND_LADDER_STEPS)],
});

export const dematerializeToFlat = (parent: ComposeContainer): ComposeContainer => {
  const tracks = collectTrackChildren(parent);
  const [survivor] = tracks;

  if (tracks.length !== 1 || survivor === undefined) {
    return parent;
  }

  return {
    nodeType: "container",
    id: parent.id,
    header: parent.header,
    notes: parent.notes,
    repetition: { kind: "ladder", steps: ladderSteps(survivor) },
    children: [],
  };
};
