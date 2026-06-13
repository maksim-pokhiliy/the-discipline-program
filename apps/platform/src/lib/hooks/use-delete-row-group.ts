"use client";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useDeleteRowGroup = (planId: string, startDate: string) =>
  useWeekMutation<{ rowGroupId: string }, void>({
    mutationFn: ({ rowGroupId }) => api.rowGroups.delete(planId, rowGroupId),
    planId,
    startDate,
    successMessage: "Group ungrouped",
    errorMessage: "Failed to ungroup",
  });
