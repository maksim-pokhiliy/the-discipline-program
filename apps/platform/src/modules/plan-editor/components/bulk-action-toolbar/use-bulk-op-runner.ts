"use client";

import { useCallback, useState } from "react";

import { type UseMutateAsyncFunction } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type BulkPatchPlanInput,
  type BulkPatchPlanResponse,
} from "@repo/contracts/lms/training-plan";

import { type BulkOpChunks } from "./op-builders";

type RunnerState = {
  running: boolean;
  completedChunks: number;
  totalChunks: number;
};

const initialState: RunnerState = {
  running: false,
  completedChunks: 0,
  totalChunks: 0,
};

type BulkPatchMutateAsync = UseMutateAsyncFunction<
  BulkPatchPlanResponse,
  Error,
  BulkPatchPlanInput,
  unknown
>;

export type UseBulkOpRunnerApi = {
  state: RunnerState;
  run: (chunks: BulkOpChunks) => Promise<boolean>;
};

export type UseBulkOpRunnerOptions = {
  mutateAsync: BulkPatchMutateAsync;
  successMessage?: string;
};

export const useBulkOpRunner = ({
  mutateAsync,
  successMessage,
}: UseBulkOpRunnerOptions): UseBulkOpRunnerApi => {
  const [state, setState] = useState<RunnerState>(initialState);

  const run = useCallback(
    async (chunks: BulkOpChunks): Promise<boolean> => {
      if (chunks.length === 0) {
        return true;
      }

      setState({ running: true, completedChunks: 0, totalChunks: chunks.length });

      let completed = 0;
      let totalConflicts = 0;

      try {
        for (const chunk of chunks) {
          const response = await mutateAsync({ ops: [...chunk] });

          if (response.conflicts && response.conflicts.length > 0) {
            totalConflicts += response.conflicts.length;
            toast.warning(
              `${response.conflicts.length.toString()} entries had conflicts. Refresh to see latest.`,
            );
            setState((prev) => ({ ...prev, running: false }));

            return false;
          }

          completed += 1;
          setState((prev) => ({ ...prev, completedChunks: completed }));
        }

        if (successMessage) {
          const suffix =
            totalConflicts > 0 ? ` (${totalConflicts.toString()} conflicts skipped)` : "";

          toast.success(`${successMessage}${suffix}`);
        }

        setState({ running: false, completedChunks: completed, totalChunks: chunks.length });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Bulk action failed";

        toast.error(
          `Completed ${completed.toString()} of ${chunks.length.toString()} chunks — ${message}`,
        );
        setState((prev) => ({ ...prev, running: false }));

        return false;
      }
    },
    [mutateAsync, successMessage],
  );

  return { state, run };
};
