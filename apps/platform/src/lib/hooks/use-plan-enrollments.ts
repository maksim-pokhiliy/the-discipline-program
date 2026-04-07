"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreatePlanEnrollmentData,
  PlanEnrollment,
  UpdatePlanEnrollmentData,
} from "@repo/contracts/plan-enrollment";
import { platformKeys } from "@repo/query";

import { api } from "../api";

export const usePlanEnrollments = (planId: string) =>
  useQuery({
    queryKey: platformKeys.planEnrollments.byPlan(planId),
    queryFn: () => api.planEnrollments.getAll(planId),
    enabled: !!planId,
  });

export const useCreatePlanEnrollment = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanEnrollmentData) => api.planEnrollments.create(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.planEnrollments.byPlan(planId),
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      toast.success("Athlete enrolled");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to enroll athlete");
    },
  });
};

export const useBulkEnrollAthletes = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) =>
      Promise.all(userIds.map((id) => api.planEnrollments.create(planId, { userId: id }))),
    onSuccess: (results) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.planEnrollments.byPlan(planId),
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      toast.success(`${results.length} athlete${results.length === 1 ? "" : "s"} enrolled`);
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.planEnrollments.byPlan(planId),
      });
      toast.error(error.message || "Failed to enroll athletes");
    },
  });
};

export const useUpdatePlanEnrollment = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanEnrollmentData }) =>
      api.planEnrollments.update(planId, id, data),
    onMutate: async ({ id, data }) => {
      const key = platformKeys.planEnrollments.byPlan(planId);

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<PlanEnrollment[]>(key);

      if (previous) {
        queryClient.setQueryData(
          key,
          previous.map((e) => (e.id === id ? { ...e, ...data } : e)),
        );
      }

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(platformKeys.planEnrollments.byPlan(planId), context.previous);
      }

      toast.error("Failed to update enrollment");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.planEnrollments.byPlan(planId),
      });
    },
  });
};

export const useDeletePlanEnrollment = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.planEnrollments.delete(planId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.planEnrollments.byPlan(planId),
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
    },
    onError: () => {
      toast.error("Failed to remove enrollment");
    },
  });
};
