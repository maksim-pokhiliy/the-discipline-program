"use client";

import type { RowGroup, UpdateRowGroupRequest } from "@repo/contracts/lms/row-group";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useUpdateRowGroup = (planId: string, startDate: string) =>
  useWeekMutation<{ rowGroupId: string; data: UpdateRowGroupRequest }, RowGroup>({
    mutationFn: ({ rowGroupId, data }) => api.rowGroups.update(planId, rowGroupId, data),
    planId,
    startDate,
    successMessage: "Group updated",
    errorMessage: "Failed to update group",
  });
