"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type {
  CloneDayResponse,
  DaySlot,
  UpdateDayLabelData,
  UpdateDayNotesData,
} from "@repo/contracts/lms/day";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

import { useWeekMutation } from "./use-week-mutation";

export const useUpdateDayLabel = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<UpdateDayLabelData, DaySlot>({
    mutationFn: (data) => api.dayMetadata.setLabel(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Day label saved",
    errorMessage: "Failed to save day label",
  });

export const useUpdateDayNotes = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<UpdateDayNotesData, DaySlot>({
    mutationFn: (data) => api.dayMetadata.setNotes(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Day notes saved",
    errorMessage: "Failed to save day notes",
  });

export const useCloneDayFrom = (
  planId: string,
  startDate: string,
  dayOfWeek: DayOfWeek,
): UseMutationResult<
  CloneDayResponse,
  Error,
  { sourceStartDate: string; sourceDayOfWeek: DayOfWeek }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceStartDate, sourceDayOfWeek }) =>
      api.dayMetadata.cloneFrom(planId, startDate, dayOfWeek, { sourceStartDate, sourceDayOfWeek }),
    onSuccess: (result) => {
      if (result.cloned) {
        queryClient.invalidateQueries({
          queryKey: platformKeys.weeks.byDate(planId, startDate),
        });
        toast.success(`Day replaced — ${result.day.sessions.length} sessions cloned.`);
      }
    },
    onError: (error: Error) => {
      notifyError(error, "Couldn't clone — try again.");
    },
  });
};
