"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateBenchmarkResultRequest } from "@repo/contracts/lms/benchmark-result";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type LogBenchmarkResultArgs = {
  sessionId: string;
  data: CreateBenchmarkResultRequest;
};

export const useLogBenchmarkResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: LogBenchmarkResultArgs) =>
      api.benchmarkResults.create(sessionId, data),
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.athleteSessionView.detail(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.oneRMRecords.list() });
      toast.success("Result saved");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to save result");
    },
  });
};
