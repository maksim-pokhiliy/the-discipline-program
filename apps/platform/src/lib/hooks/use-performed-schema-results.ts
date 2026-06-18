"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreatePerformedSchemaResultRequest } from "@repo/contracts/lms/performed-schema-result";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type CreatePerformedSchemaResultArgs = {
  performedSessionId: string;
  sessionId: string;
  data: CreatePerformedSchemaResultRequest;
};

export const useCreatePerformedSchemaResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ performedSessionId, data }: CreatePerformedSchemaResultArgs) =>
      api.performedSchemaResults.create(performedSessionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.athleteSessionView.detail(variables.sessionId),
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.planTimetable.data() });
      toast.success("Result saved");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to save result");
    },
  });
};
