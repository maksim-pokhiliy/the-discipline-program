"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreatePerformedSessionRequest } from "@repo/contracts/lms/performed-session";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCreatePerformedSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePerformedSessionRequest) => api.performedSessions.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.athleteSessionView.detail(variables.sessionId),
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.planTimetable.data() });
      toast.success("Session logged");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to log session");
    },
  });
};
