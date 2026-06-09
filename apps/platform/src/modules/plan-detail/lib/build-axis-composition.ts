import type { ZodIssue } from "zod";

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
import { hasLadderMarkerConflict, LADDER_MARKER_CONFLICT } from "./ladder-marker-conflict";

const BUILD_FAILURE_FALLBACK = "Could not build composition.";

const PATH_SEPARATOR = ".";

const formatIssue = (issue: ZodIssue): string =>
  issue.path.length > 0 ? `${issue.path.join(PATH_SEPARATOR)}: ${issue.message}` : issue.message;

export type CompositionResult =
  | { ok: true; composition: Composition }
  | { ok: false; error: string };

const identityRefMap = (arrangement: DraftArrangement): ReadonlyMap<NodeId, string> => {
  const map = new Map<NodeId, string>();

  if (arrangement.kind === "parallel") {
    for (const track of arrangement.tracks) {
      map.set(track.childSchemaId, track.childSchemaId);
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
  if (hasLadderMarkerConflict(draft)) {
    return { ok: false, error: LADDER_MARKER_CONFLICT };
  }

  const base = composeContainerToComposition(draft);
  const folded = foldArrangement(draft);

  if (!folded.ok) {
    const [first] = folded.issues;

    return { ok: false, error: first === undefined ? BUILD_FAILURE_FALLBACK : first.message };
  }

  const composition: Composition =
    folded.arrangement !== undefined ? { ...base, arrangement: folded.arrangement } : base;
  const parsed = compositionSchema.safeParse(composition);

  if (!parsed.success) {
    const [issue] = parsed.error.issues;

    return { ok: false, error: issue === undefined ? BUILD_FAILURE_FALLBACK : formatIssue(issue) };
  }

  return { ok: true, composition: parsed.data };
};
