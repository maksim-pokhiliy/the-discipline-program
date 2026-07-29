"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type {
  CreateOneRMRecordRequest,
  CreateOneRMRecordResponse,
  GetOneRMRecordsResponse,
} from "@repo/contracts/lms/one-rm-record";
import { notifyError, useSubmitToken } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useOneRMRecords = (
  exerciseId?: string,
): UseQueryResult<GetOneRMRecordsResponse, Error> =>
  useQuery({
    queryKey: platformKeys.oneRMRecords.list(exerciseId),
    queryFn: () => api.oneRMRecords.list(exerciseId),
  });

export const useCreateOneRMRecord = (): UseMutationResult<
  CreateOneRMRecordResponse,
  Error,
  CreateOneRMRecordRequest
> => {
  const queryClient = useQueryClient();
  const submitToken = useSubmitToken();

  return useMutation({
    networkMode: "always",
    mutationFn: (data: CreateOneRMRecordRequest) =>
      api.oneRMRecords.create(data, submitToken.get(data.exerciseId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.oneRMRecords.list() });
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to save 1RM");
    },
    onSettled: (_result, _error, variables) => {
      submitToken.reset(variables.exerciseId);
    },
  });
};
