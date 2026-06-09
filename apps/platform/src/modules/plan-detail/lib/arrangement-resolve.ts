import type {
  ArrangementAxis as ContractArrangementAxis,
  ParallelTrack as ContractParallelTrack,
  SupersetPair as ContractSupersetPair,
} from "@repo/contracts/lms/composition";

import type {
  NodeId,
  ParallelTrackDraft,
  SupersetPairDraft,
} from "../components/axes/axis-draft.types";

import type { DraftArrangement } from "./arrangement-convert";

export type ResolveArrangementResult =
  | { ok: true; arrangement: ContractArrangementAxis }
  | { ok: false; missing: NodeId };

type RefMap = ReadonlyMap<NodeId, string>;

type Resolved<T> = { ok: true; value: T } | { ok: false; missing: NodeId };

type ParallelInterleaveOrder = Extract<DraftArrangement, { kind: "parallel" }>["interleaveOrder"];

const resolveTrack = (
  track: ParallelTrackDraft,
  refMap: RefMap,
): Resolved<ContractParallelTrack> => {
  const childSchemaId = refMap.get(track.childSchemaId);

  if (childSchemaId === undefined) {
    return { ok: false, missing: track.childSchemaId };
  }

  return { ok: true, value: { childSchemaId } };
};

const resolvePair = (pair: SupersetPairDraft, refMap: RefMap): Resolved<ContractSupersetPair> => {
  const rowIds: string[] = [];

  for (const rowId of pair.rowIds) {
    const resolved = refMap.get(rowId);

    if (resolved === undefined) {
      return { ok: false, missing: rowId };
    }

    rowIds.push(resolved);
  }

  return { ok: true, value: { label: pair.label, rowIds } };
};

const resolveParallel = (
  interleaveOrder: ParallelInterleaveOrder,
  tracks: ParallelTrackDraft[],
  refMap: RefMap,
): ResolveArrangementResult => {
  const resolvedTracks: ContractParallelTrack[] = [];

  for (const track of tracks) {
    const resolved = resolveTrack(track, refMap);

    if (!resolved.ok) {
      return resolved;
    }

    resolvedTracks.push(resolved.value);
  }

  return { ok: true, arrangement: { kind: "parallel", interleaveOrder, tracks: resolvedTracks } };
};

const resolveSuperset = (pairs: SupersetPairDraft[], refMap: RefMap): ResolveArrangementResult => {
  const resolvedPairs: ContractSupersetPair[] = [];

  for (const pair of pairs) {
    const resolved = resolvePair(pair, refMap);

    if (!resolved.ok) {
      return resolved;
    }

    resolvedPairs.push(resolved.value);
  }

  return { ok: true, arrangement: { kind: "superset", pairs: resolvedPairs } };
};

export const resolveArrangement = (
  deferred: DraftArrangement,
  refMap: RefMap,
): ResolveArrangementResult => {
  switch (deferred.kind) {
    case "parallel":
      return resolveParallel(deferred.interleaveOrder, deferred.tracks, refMap);
    case "superset":
      return resolveSuperset(deferred.pairs, refMap);
    default:
      return deferred satisfies never;
  }
};
