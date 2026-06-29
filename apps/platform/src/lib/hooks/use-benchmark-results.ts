"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateBenchmarkResultRequest } from "@repo/contracts/lms/benchmark-result";
import { notifyError, useSubmitToken } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type LogBenchmarkResultArgs = {
  sessionId: string;
  data: CreateBenchmarkResultRequest;
};

export const useLogBenchmarkResult = () => {
  const queryClient = useQueryClient();
  const submitToken = useSubmitToken();

  return useMutation({
    mutationFn: ({ sessionId, data }: LogBenchmarkResultArgs) =>
      api.benchmarkResults.create(sessionId, data, submitToken.get(data.plannedSchemaId)),
    onSuccess: (_data, { sessionId, data }) => {
      submitToken.reset(data.plannedSchemaId);
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
