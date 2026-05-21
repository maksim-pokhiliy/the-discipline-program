"use client";

import type {
  AddMemberAlternatingGroupRequest,
  AlternatingGroup,
  CreateAlternatingGroupRequest,
} from "@repo/contracts/lms/alternating-group";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useCreateAlternatingGroup = (planId: string, startDate: string) =>
  useWeekMutation<CreateAlternatingGroupRequest, AlternatingGroup>({
    mutationFn: (data) => api.alternatingGroups.create(planId, data),
    planId,
    startDate,
    successMessage: "Alternating group created",
    errorMessage: "Failed to create alternating group",
  });

export const useDeleteAlternatingGroup = (planId: string, startDate: string) =>
  useWeekMutation<{ groupId: string }, void>({
    mutationFn: ({ groupId }) => api.alternatingGroups.delete(planId, groupId),
    planId,
    startDate,
    successMessage: "Alternating group deleted",
    errorMessage: "Failed to delete alternating group",
  });

export const useAddAlternatingGroupMember = (planId: string, startDate: string) =>
  useWeekMutation<{ groupId: string; data: AddMemberAlternatingGroupRequest }, AlternatingGroup>({
    mutationFn: ({ groupId, data }) => api.alternatingGroups.addMember(planId, groupId, data),
    planId,
    startDate,
    successMessage: "Member added",
    errorMessage: "Failed to add member",
  });

export const useRemoveAlternatingGroupMember = (planId: string, startDate: string) =>
  useWeekMutation<{ groupId: string; schemaId: string }, AlternatingGroup | null>({
    mutationFn: ({ groupId, schemaId }) =>
      api.alternatingGroups.removeMember(planId, groupId, schemaId),
    planId,
    startDate,
    successMessage: "Member removed",
    errorMessage: "Failed to remove member",
  });
