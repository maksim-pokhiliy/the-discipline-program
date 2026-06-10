"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

import type { ComposeContainer } from "../components/axes/axis-draft.types";

import { buildParallelCreateRequest } from "./build-parallel-schemas";

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
    const built = buildParallelCreateRequest(draft, blockId, parentSchemaId);

    if (!built.ok) {
      onError(built.error);

      return;
    }

    setIsPending(true);

    try {
      await api.schemas.createParallel(planId, built.request);
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
