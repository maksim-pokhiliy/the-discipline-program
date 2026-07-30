"use client";

import { useRef } from "react";

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

const SUBMIT_TOKEN_SEPARATOR = ":";
const CALENDAR_PART_SEPARATOR = "-";

const calendarDayOf = (recordedAt: Date): string =>
  [recordedAt.getFullYear(), recordedAt.getMonth(), recordedAt.getDate()].join(
    CALENDAR_PART_SEPARATOR,
  );

const submitTokenKeyOf = ({
  exerciseId,
  valueKg,
  source,
  recordedAt,
}: CreateOneRMRecordRequest): string =>
  [exerciseId, valueKg, source, calendarDayOf(recordedAt)].join(SUBMIT_TOKEN_SEPARATOR);

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
  const bodyFrozenUnderToken = useRef(new Map<string, CreateOneRMRecordRequest>());

  const freezeBodyUnderToken = (data: CreateOneRMRecordRequest): CreateOneRMRecordRequest => {
    const key = submitTokenKeyOf(data);
    const frozen = bodyFrozenUnderToken.current.get(key) ?? data;

    bodyFrozenUnderToken.current.set(key, frozen);

    return frozen;
  };

  const retireTokenAndItsBody = (key: string): void => {
    submitToken.reset(key);
    bodyFrozenUnderToken.current.delete(key);
  };

  return useMutation({
    networkMode: "always",
    mutationFn: (data: CreateOneRMRecordRequest) => {
      const frozen = freezeBodyUnderToken(data);

      return api.oneRMRecords.create(frozen, submitToken.get(submitTokenKeyOf(data)));
    },
    onSuccess: (_result, variables) => {
      retireTokenAndItsBody(submitTokenKeyOf(variables));
      queryClient.invalidateQueries({ queryKey: platformKeys.oneRMRecords.list() });
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to save 1RM");
    },
  });
};
