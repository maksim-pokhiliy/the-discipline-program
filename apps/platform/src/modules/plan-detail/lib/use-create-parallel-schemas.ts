"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateSchemaRequest, Schema } from "@repo/contracts/lms/schema";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

import type { ComposeContainer } from "../components/axes/axis-draft.types";

import { buildParallelCreateSequence } from "./build-parallel-schemas";

const SUCCESS_MESSAGE = "Parallel ladder created";

type RunArgs = {
  blockId: string;
  parentSchemaId?: string;
  draft: ComposeContainer;
};

type RunOptions = {
  onSuccess: () => void;
  onError: (message: string) => void;
};

export type UseCreateParallelSchemasResult = {
  run: (args: RunArgs, opts: RunOptions) => Promise<void>;
  isPending: boolean;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const useCreateParallelSchemas = (
  planId: string,
  startDate: string,
): UseCreateParallelSchemasResult => {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const run = async (
    { blockId, parentSchemaId, draft }: RunArgs,
    { onSuccess, onError }: RunOptions,
  ): Promise<void> => {
    const sequence = buildParallelCreateSequence(draft);

    if (!sequence.ok) {
      onError(sequence.error);

      return;
    }

    setIsPending(true);

    try {
      const parentRequest: CreateSchemaRequest = {
        blockId,
        ...(parentSchemaId != null && { parentSchemaId }),
        composition: sequence.parentComposition,
        header: sequence.parentHeader,
        notes: null,
      };

      const parent: Schema = await api.schemas.create(planId, parentRequest);

      for (const track of sequence.tracks) {
        const trackRequest: CreateSchemaRequest = {
          blockId,
          parentSchemaId: parent.id,
          composition: track.composition,
          header: track.header,
          notes: null,
        };

        await api.schemas.create(planId, trackRequest);
      }

      toast.success(SUCCESS_MESSAGE);
      onSuccess();
    } catch (error) {
      onError(toErrorMessage(error));
    } finally {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
      setIsPending(false);
    }
  };

  return { run, isPending };
};
