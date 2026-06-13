import type { ZodIssue } from "zod";

import {
  type CreateGroupRequest,
  createGroupRequestSchema,
} from "@repo/contracts/lms/schema-group";

import type { GroupDraft } from "../components/axes/axis-draft.types";

import { formatZodIssue } from "./format-zod-issue";
import { hasParallelTracks } from "./parallel-ladder-draft";

const NOT_PARALLEL_ERROR = "Expected a parallel draft with at least two ladder tracks.";

const REQUEST_BUILD_FALLBACK = "could not build the group create request.";

export type GroupCreateRequestResult =
  | { ok: true; request: CreateGroupRequest }
  | { ok: false; error: string };

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

export const buildGroupCreateRequest = (
  group: GroupDraft,
  blockId: string,
): GroupCreateRequestResult => {
  if (!hasParallelTracks(group)) {
    return { ok: false, error: NOT_PARALLEL_ERROR };
  }

  const tracks = group.tracks.map((track) => ({
    header: track.header,
    steps: track.steps,
  }));

  const parsed = createGroupRequestSchema.safeParse({
    blockId,
    notes: group.header === null ? null : [group.header],
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
