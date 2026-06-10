"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

import type { ComposeContainer } from "../components/axes/axis-draft.types";

import { collectTrackChildren } from "./arrangement-tree";
import { MIN_TRACKS_FOR_PARALLEL } from "./parallel-ladder-draft";

const SUCCESS_MESSAGE = "Ladders created";
const NOT_PARALLEL_ERROR = "Expected a parallel draft with at least two ladder tracks.";

type RunArgs = {
  blockId: string;
  parentSchemaId?: string;
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

const partialFailureMessage = (createdCount: number, total: number, reason: string): string =>
  `Created ${createdCount} of ${total} ladders; the rest failed: ${reason}`;

export const useCreateIndependentLadders = (
  planId: string,
  startDate: string,
): UseCreateIndependentLaddersResult => {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const run = async (
    { blockId, parentSchemaId, draft }: RunArgs,
    { onSuccess, onError }: RunOptions,
  ): Promise<void> => {
    const tracks = collectTrackChildren(draft);

    if (tracks.length < MIN_TRACKS_FOR_PARALLEL) {
      onError(NOT_PARALLEL_ERROR);

      return;
    }

    setIsPending(true);

    let failureMessage: string | null = null;
    let createdCount = 0;

    for (const track of tracks) {
      const steps = trackLadderSteps(track);

      try {
        await api.schemas.create(planId, {
          blockId,
          ...(parentSchemaId !== undefined && { parentSchemaId }),
          composition: { repetition: { kind: "ladder", steps } },
          header: null,
          notes: null,
        });
        createdCount += 1;
      } catch (error) {
        failureMessage = toErrorMessage(error);
        break;
      }
    }

    queryClient.invalidateQueries({
      queryKey: platformKeys.weeks.byDate(planId, startDate),
    });
    setIsPending(false);

    if (failureMessage !== null) {
      onError(partialFailureMessage(createdCount, tracks.length, failureMessage));

      return;
    }

    toast.success(SUCCESS_MESSAGE);
    onSuccess();
  };

  return { run, isPending };
};
