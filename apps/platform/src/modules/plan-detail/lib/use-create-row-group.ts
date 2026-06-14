"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { api } from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

import { buildRowGroupCreateRequest } from "./build-row-group-create-request";

const SUCCESS_MESSAGE = "Group created";

type RunArgs = {
  schemaId: string;
  rows: SchemaRow[];
  selectedIds: ReadonlySet<string>;
};

type RunOptions = {
  onSuccess: () => void;
  onError: (message: string) => void;
};

export type UseCreateRowGroupResult = {
  run: (args: RunArgs, opts: RunOptions) => Promise<void>;
  isPending: boolean;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const useCreateRowGroup = (planId: string, startDate: string): UseCreateRowGroupResult => {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const run = async (
    { schemaId, rows, selectedIds }: RunArgs,
    { onSuccess, onError }: RunOptions,
  ): Promise<void> => {
    const built = buildRowGroupCreateRequest(rows, selectedIds, schemaId);

    if (!built.ok) {
      onError(built.error);

      return;
    }

    setIsPending(true);

    try {
      await api.rowGroups.create(planId, built.request);
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
