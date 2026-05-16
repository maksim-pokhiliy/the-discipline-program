"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UpdateWeekNotesData } from "@repo/contracts/lms/week";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useWeek = (planId: string, startDate: string) =>
  useQuery({
    queryKey: platformKeys.weeks.byDate(planId, startDate),
    queryFn: () => api.weeks.getByDate(planId, startDate),
    enabled: !!planId && !!startDate,
  });

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
