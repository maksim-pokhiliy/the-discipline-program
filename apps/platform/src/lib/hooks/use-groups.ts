"use client";

import type { SchemaGroup, UpdateGroupRequest } from "@repo/contracts/lms/schema-group";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useUpdateGroup = (planId: string, startDate: string) =>
  useWeekMutation<{ groupId: string; data: UpdateGroupRequest }, SchemaGroup>({
    mutationFn: ({ groupId, data }) => api.groups.update(planId, groupId, data),
    planId,
    startDate,
    successMessage: "Group updated",
    errorMessage: "Failed to update group",
  });

export const useDeleteGroup = (planId: string, startDate: string) =>
  useWeekMutation<{ groupId: string }, void>({
    mutationFn: ({ groupId }) => api.groups.delete(planId, groupId),
    planId,
    startDate,
    successMessage: "Group deleted",
    errorMessage: "Failed to delete group",
  });
