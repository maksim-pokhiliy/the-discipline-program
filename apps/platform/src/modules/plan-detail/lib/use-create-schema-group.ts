"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

import { buildSchemaGroupCreateRequest } from "./build-schema-group-create-request";

const SUCCESS_MESSAGE = "Group created";

type RunArgs = {
  blockId: string;
  schemas: SchemaWithBody[];
  selectedIds: ReadonlySet<string>;
};

type RunOptions = {
  onSuccess: () => void;
  onError: (message: string) => void;
};

export type UseCreateSchemaGroupResult = {
  run: (args: RunArgs, opts: RunOptions) => Promise<void>;
  isPending: boolean;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const useCreateSchemaGroup = (
  planId: string,
  startDate: string,
): UseCreateSchemaGroupResult => {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const run = async (
    { blockId, schemas, selectedIds }: RunArgs,
    { onSuccess, onError }: RunOptions,
  ): Promise<void> => {
    const built = buildSchemaGroupCreateRequest(schemas, selectedIds, blockId);

    if (!built.ok) {
      onError(built.error);

      return;
    }

    setIsPending(true);

    try {
      await api.groups.create(planId, built.request);
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
