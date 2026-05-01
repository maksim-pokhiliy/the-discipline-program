"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreatePlanCoachAssignmentInput } from "@repo/contracts/lms/plan-coach-assignment";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const usePlanCoachAssignments = (planId: string) =>
  useQuery({
    queryKey: platformKeys.trainingPlans.coaches(planId),
    queryFn: () => api.planCoachAssignments.list(planId),
    enabled: !!planId,
  });

export const useAddPlanCoach = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanCoachAssignmentInput) =>
      api.planCoachAssignments.create(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.trainingPlans.coaches(planId),
      });
      toast.success("Coach added");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to add coach");
    },
  });
};

export const useRemovePlanCoach = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) => api.planCoachAssignments.delete(planId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.trainingPlans.coaches(planId),
      });
      toast.success("Coach removed");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to remove coach");
    },
  });
};
