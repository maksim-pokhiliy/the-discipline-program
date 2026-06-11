"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ZodIssue } from "zod";

import { createSchemaRequestSchema } from "@repo/contracts/lms/schema";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

import type { ComposeContainer } from "../components/axes/axis-draft.types";

import { collectTrackChildren } from "./arrangement-tree";
import { formatZodIssue } from "./format-zod-issue";
import { MIN_TRACKS_FOR_PARALLEL } from "./parallel-ladder-draft";

const SUCCESS_MESSAGE = "Ladders created";
const NOT_PARALLEL_ERROR = "Expected a parallel draft with at least two ladder tracks.";
const INVALID_LADDER_FALLBACK = "the draft has invalid ladder steps.";
const COMPOSITION_PATH_ROOT = "composition";
const STEPS_PATH_FIELD = "steps";

type RunArgs = {
  blockId: string;
  draft: ComposeContainer;
};

type RunOptions = {
  onSuccess: () => void;
  onError: (message: string) => void;
};

export type UseCreateIndependentLaddersResult = {
  run: (args: RunArgs, opts: RunOptions) => Promise<void>;
  isPending: boolean;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const trackLadderSteps = (track: ComposeContainer): number[] =>
  track.repetition?.kind === "ladder" ? track.repetition.steps : [];

const buildCreateRequest = (track: ComposeContainer, blockId: string) => ({
  blockId,
  composition: { repetition: { kind: "ladder" as const, steps: trackLadderSteps(track) } },
  header: null,
  notes: null,
});

const coachIssuePath = (path: ZodIssue["path"], trackIndex: number): ZodIssue["path"] => {
  const [root, field, stepIndex] = path;
  const ladder = `ladder ${trackIndex + 1}`;

  if (root !== COMPOSITION_PATH_ROOT || field !== STEPS_PATH_FIELD) {
    return [ladder];
  }

  return typeof stepIndex === "number" ? [`${ladder}, step ${stepIndex + 1}`] : [`${ladder} steps`];
};

const validateLadderTracks = (tracks: ComposeContainer[], blockId: string): string | null => {
  for (const [trackIndex, track] of tracks.entries()) {
    const parsed = createSchemaRequestSchema.safeParse(buildCreateRequest(track, blockId));

    if (parsed.success) {
      continue;
    }

    const [issue] = parsed.error.issues;

    return issue === undefined
      ? INVALID_LADDER_FALLBACK
      : formatZodIssue({ ...issue, path: coachIssuePath(issue.path, trackIndex) });
  }

  return null;
};

const partialFailureMessage = (createdCount: number, total: number, reason: string): string =>
  `Created ${createdCount} of ${total} ladders; the rest failed: ${reason}`;

export const useCreateIndependentLadders = (
  planId: string,
  startDate: string,
): UseCreateIndependentLaddersResult => {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const run = async (
    { blockId, draft }: RunArgs,
    { onSuccess, onError }: RunOptions,
  ): Promise<void> => {
    const tracks = collectTrackChildren(draft);

    if (tracks.length < MIN_TRACKS_FOR_PARALLEL) {
      onError(NOT_PARALLEL_ERROR);

      return;
    }

    const validationError = validateLadderTracks(tracks, blockId);

    if (validationError !== null) {
      onError(validationError);

      return;
    }

    setIsPending(true);

    const idempotencyBaseKey = draft.id;

    let failureMessage: string | null = null;
    let createdCount = 0;

    try {
      for (const [trackIndex, track] of tracks.entries()) {
        try {
          await api.schemas.create(
            planId,
            buildCreateRequest(track, blockId),
            `${idempotencyBaseKey}:${trackIndex}`,
          );
          createdCount += 1;
        } catch (error) {
          failureMessage = toErrorMessage(error);
          break;
        }
      }
    } finally {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
      setIsPending(false);
    }

    if (failureMessage !== null) {
      onError(partialFailureMessage(createdCount, tracks.length, failureMessage));

      return;
    }

    toast.success(SUCCESS_MESSAGE);
    onSuccess();
  };

  return { run, isPending };
};
