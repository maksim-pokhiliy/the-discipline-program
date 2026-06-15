"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type { CloneWeekResponse, UpdateWeekNotesData } from "@repo/contracts/lms/week";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useWeek = (planId: string, startDate: string) =>
  useQuery({
    queryKey: platformKeys.weeks.byDate(planId, startDate),
    queryFn: () => api.weeks.getByDate(planId, startDate),
    enabled: !!planId && !!startDate,
  });

export const useListPopulatedWeeks = (planId: string, enabled: boolean) =>
  useQuery({
    queryKey: platformKeys.weeks.populated(planId),
    queryFn: () => api.weeks.listPopulated(planId),
    enabled: enabled && !!planId,
  });

export const useCloneWeekFrom = (
  planId: string,
  startDate: string,
): UseMutationResult<CloneWeekResponse, Error, { sourceStartDate: string }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceStartDate }) =>
      api.weeks.cloneFrom(planId, startDate, { sourceStartDate }),
    onSuccess: (result) => {
      if (result.cloned) {
        queryClient.invalidateQueries({
          queryKey: platformKeys.weeks.byDate(planId, startDate),
        });
      }
    },
    onError: (error: Error) => {
      notifyError(error, "Couldn't clone — try again.");
    },
  });
};

export const useUpdateWeekNotes = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ startDate, data }: { startDate: string; data: UpdateWeekNotesData }) =>
      api.weeks.updateNotes(planId, startDate, data),
    onSuccess: (_week, { startDate }) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
      toast.success("Week notes saved");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to save week notes");
    },
  });
};
