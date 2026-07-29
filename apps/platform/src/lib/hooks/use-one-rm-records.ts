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
  const inFlightBodies = useRef(new Map<string, CreateOneRMRecordRequest>());

  return useMutation({
    networkMode: "always",
    mutationFn: (data: CreateOneRMRecordRequest) => {
      const key = submitTokenKeyOf(data);
      const body = inFlightBodies.current.get(key) ?? data;

      inFlightBodies.current.set(key, body);

      return api.oneRMRecords.create(body, submitToken.get(key));
    },
    onSuccess: (_result, variables) => {
      const key = submitTokenKeyOf(variables);

      submitToken.reset(key);
      inFlightBodies.current.delete(key);
      queryClient.invalidateQueries({ queryKey: platformKeys.oneRMRecords.list() });
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to save 1RM");
    },
  });
};
