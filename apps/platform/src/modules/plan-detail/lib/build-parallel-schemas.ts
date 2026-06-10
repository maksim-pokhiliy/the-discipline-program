import {
  type CreateParallelSchemasRequest,
  createParallelSchemasRequestSchema,
} from "@repo/contracts/lms/schema";

import type { ComposeContainer } from "../components/axes/axis-draft.types";

import { collectTrackChildren } from "./arrangement-tree";
import { formatZodIssue } from "./format-zod-issue";
import { isParallelDraft } from "./parallel-ladder-draft";

const NOT_PARALLEL_ERROR = "Expected a parallel draft with at least two ladder tracks.";

const REQUEST_BUILD_FALLBACK = "could not build the parallel create request.";

export type ParallelCreateRequestResult =
  | { ok: true; request: CreateParallelSchemasRequest }
  | { ok: false; error: string };

const trackLadderSteps = (track: ComposeContainer): number[] =>
  track.repetition?.kind === "ladder" ? track.repetition.steps : [];

export const buildParallelCreateRequest = (
  parent: ComposeContainer,
  blockId: string,
  parentSchemaId?: string,
): ParallelCreateRequestResult => {
  if (!isParallelDraft(parent)) {
    return { ok: false, error: NOT_PARALLEL_ERROR };
  }

  const tracks = collectTrackChildren(parent).map((track) => ({
    header: track.header,
    steps: trackLadderSteps(track),
  }));

  const parsed = createParallelSchemasRequestSchema.safeParse({
    blockId,
    ...(parentSchemaId != null && { parentSchemaId }),
    header: parent.header,
    tracks,
  });

  if (!parsed.success) {
    const [issue] = parsed.error.issues;

    return {
      ok: false,
      error: issue === undefined ? REQUEST_BUILD_FALLBACK : formatZodIssue(issue),
    };
  }

  return { ok: true, request: parsed.data };
};
