import type {
  ArrangementAxis as ContractArrangementAxis,
  SupersetPair as ContractSupersetPair,
} from "@repo/contracts/lms/composition";

import type { NodeId, SupersetPairDraft } from "../components/axes/axis-draft.types";

import type { DraftArrangement } from "./arrangement-convert";

export type ResolveArrangementResult =
  | { ok: true; arrangement: ContractArrangementAxis }
  | { ok: false; missing: NodeId };

type RefMap = ReadonlyMap<NodeId, string>;

type Resolved<T> = { ok: true; value: T } | { ok: false; missing: NodeId };

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
): ResolveArrangementResult => resolveSuperset(deferred.pairs, refMap);
