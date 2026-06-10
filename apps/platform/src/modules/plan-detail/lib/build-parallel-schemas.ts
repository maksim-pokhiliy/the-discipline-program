import type { ZodIssue } from "zod";

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

const coachIssuePath = (path: ZodIssue["path"]): ZodIssue["path"] => {
  const [root, trackIndex, field, stepIndex] = path;

  if (root !== "tracks") {
    return path;
  }

  if (typeof trackIndex !== "number") {
    return ["ladders"];
  }

  const ladder = `ladder ${trackIndex + 1}`;

  if (field === "header") {
    return [`${ladder} name`];
  }

  if (field !== "steps") {
    return [ladder];
  }

  return typeof stepIndex === "number" ? [`${ladder}, step ${stepIndex + 1}`] : [`${ladder} steps`];
};

const formatCoachIssue = (issue: ZodIssue): string =>
  formatZodIssue({ ...issue, path: coachIssuePath(issue.path) });

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
      error: issue === undefined ? REQUEST_BUILD_FALLBACK : formatCoachIssue(issue),
    };
  }

  return { ok: true, request: parsed.data };
};
