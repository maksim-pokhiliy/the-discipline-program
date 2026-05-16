"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

import { notifyError } from "@repo/query";

import { platformKeys } from "../api/keys";

type UseWeekMutationConfig<TVars, TResult> = {
  mutationFn: (vars: TVars) => Promise<TResult>;
  planId: string;
  startDate: string;
  successMessage: string;
  errorMessage: string;
};

export const useWeekMutation = <TVars, TResult>({
  mutationFn,
  planId,
  startDate,
  successMessage,
  errorMessage,
}: UseWeekMutationConfig<TVars, TResult>): UseMutationResult<TResult, Error, TVars> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
      toast.success(successMessage);
    },
    onError: (error: Error) => {
      notifyError(error, errorMessage);
    },
  });
};
