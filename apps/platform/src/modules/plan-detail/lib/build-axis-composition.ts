import { type Composition, compositionSchema } from "@repo/contracts/lms/composition";

import type {
  ArrangementAxis,
  ComposeContainer,
  NodeId,
} from "../components/axes/axis-draft.types";

import {
  type ConvertIssue,
  type DraftArrangement,
  validateDeferredArrangement,
} from "./arrangement-convert";
import { resolveArrangement } from "./arrangement-resolve";
import { composeContainerToComposition } from "./compose-container-to-composition";

export const AXIS_REFUSAL_MESSAGE = "This schema contains a rep-scheme not yet editable.";

export type CompositionResult =
  | { ok: true; composition: Composition }
  | { ok: false; error: string };

const identityRefMap = (arrangement: DraftArrangement): ReadonlyMap<NodeId, string> => {
  const map = new Map<NodeId, string>();

  if (arrangement.kind === "parallel") {
    for (const track of arrangement.tracks) {
      map.set(track.childSchemaId, track.childSchemaId);

      if (track.pairedWithRowId !== undefined) {
        map.set(track.pairedWithRowId, track.pairedWithRowId);
      }
    }

    return map;
  }

  for (const pair of arrangement.pairs) {
    for (const rowId of pair.rowIds) {
      map.set(rowId, rowId);
    }
  }

  return map;
};

const foldArrangement = (
  draft: ComposeContainer,
):
  | { ok: true; arrangement: Composition["arrangement"] }
  | { ok: false; issues: ConvertIssue[] } => {
  const arrangement: ArrangementAxis | undefined = draft.arrangement;

  if (arrangement === undefined || arrangement.kind === "ordered") {
    return { ok: true, arrangement: undefined };
  }

  const issues: ConvertIssue[] = [];

  if (!validateDeferredArrangement(arrangement, draft, draft.id, issues)) {
    return { ok: false, issues };
  }

  const resolved = resolveArrangement(arrangement, identityRefMap(arrangement));

  return resolved.ok
    ? { ok: true, arrangement: resolved.arrangement }
    : { ok: true, arrangement: undefined };
};

export const previewComposition = (draft: ComposeContainer): Composition => {
  const base = composeContainerToComposition(draft);
  const folded = foldArrangement(draft);

  return folded.ok && folded.arrangement !== undefined
    ? { ...base, arrangement: folded.arrangement }
    : base;
};

export const buildComposition = (draft: ComposeContainer): CompositionResult => {
  const base = composeContainerToComposition(draft);
  const folded = foldArrangement(draft);

  if (!folded.ok) {
    const [first] = folded.issues;

    return { ok: false, error: first === undefined ? AXIS_REFUSAL_MESSAGE : first.message };
  }

  const composition: Composition =
    folded.arrangement !== undefined ? { ...base, arrangement: folded.arrangement } : base;
  const parsed = compositionSchema.safeParse(composition);

  if (!parsed.success) {
    const [issue] = parsed.error.issues;

    return { ok: false, error: issue === undefined ? AXIS_REFUSAL_MESSAGE : issue.message };
  }

  return { ok: true, composition: parsed.data };
};
