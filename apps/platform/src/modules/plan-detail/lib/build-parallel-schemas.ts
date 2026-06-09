import { type Composition, compositionSchema } from "@repo/contracts/lms/composition";

import type { ComposeContainer } from "../components/axes/axis-draft.types";

import { collectTrackChildren } from "./arrangement-tree";
import { formatZodIssue } from "./format-zod-issue";
import { isParallelDraft } from "./parallel-ladder-draft";

const NOT_PARALLEL_ERROR = "Expected a parallel draft with at least two ladder tracks.";

const TRACK_BUILD_FALLBACK = "could not build the ladder composition.";

const PARENT_COMPOSITION: Composition = {};

type ParallelTrackDescriptor = {
  composition: Composition;
  header: string | null;
};

export type ParallelCreateSequence =
  | {
      ok: true;
      parentComposition: Composition;
      parentHeader: string | null;
      tracks: ParallelTrackDescriptor[];
    }
  | { ok: false; error: string };

const trackLadderSteps = (track: ComposeContainer): number[] =>
  track.repetition?.kind === "ladder" ? track.repetition.steps : [];

export const buildParallelCreateSequence = (parent: ComposeContainer): ParallelCreateSequence => {
  if (!isParallelDraft(parent)) {
    return { ok: false, error: NOT_PARALLEL_ERROR };
  }

  const tracks: ParallelTrackDescriptor[] = [];
  const trackContainers = collectTrackChildren(parent);

  for (const [index, track] of trackContainers.entries()) {
    const composition = { repetition: { kind: "ladder", steps: trackLadderSteps(track) } };
    const parsed = compositionSchema.safeParse(composition);

    if (!parsed.success) {
      const [issue] = parsed.error.issues;
      const detail = issue === undefined ? TRACK_BUILD_FALLBACK : formatZodIssue(issue);

      return { ok: false, error: `ladder ${index + 1}: ${detail}` };
    }

    tracks.push({ composition: parsed.data, header: track.header });
  }

  return { ok: true, parentComposition: PARENT_COMPOSITION, parentHeader: parent.header, tracks };
};
