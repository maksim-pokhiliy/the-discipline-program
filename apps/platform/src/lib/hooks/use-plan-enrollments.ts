"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type PlanRosterEntry } from "@repo/contracts/coaching/plan-roster";
import type {
  CreatePlanEnrollmentData,
  PlanEnrollment,
  UpdatePlanEnrollmentData,
} from "@repo/contracts/lms/plan-enrollment";
import { notifyError, useOptimisticMutation } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

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
      notifyError(error, "Failed to enroll athlete");
    },
  });
};

export const useBulkEnrollAthletes = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.allSettled(
        userIds.map((id) => api.planEnrollments.create(planId, { userId: id })),
      );

      const fulfilled = results.filter(
        (r): r is PromiseFulfilledResult<PlanEnrollment> => r.status === "fulfilled",
      );
      const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

      if (rejected.length > 0 && fulfilled.length === 0) {
        throw new Error("Failed to enroll athletes");
      }

      return { fulfilled, rejected };
    },
    onSuccess: ({ fulfilled, rejected }) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.planEnrollments.byPlan(planId),
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });

      if (rejected.length > 0) {
        toast.warning(`${fulfilled.length} enrolled, ${rejected.length} failed`);
      } else {
        toast.success(`${fulfilled.length} athlete${fulfilled.length === 1 ? "" : "s"} enrolled`);
      }
    },
    onError: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.planEnrollments.byPlan(planId),
      });
      toast.error("Failed to enroll athletes");
    },
  });
};

export const applyEnrollmentUpdate = (
  entry: PlanRosterEntry,
  data: UpdatePlanEnrollmentData,
): PlanRosterEntry => ({
  ...entry,
  ...(data.status !== undefined && { status: data.status }),
  ...(data.endedOnDate !== undefined && { endedOnDate: data.endedOnDate }),
});

export const useUpdatePlanEnrollment = (planId: string) =>
  useOptimisticMutation<PlanRosterEntry[], { id: string; data: UpdatePlanEnrollmentData }>({
    mutationFn: ({ id, data }) => api.planEnrollments.update(planId, id, data),
    queryKey: platformKeys.planEnrollments.byPlan(planId),
    transform: (prev, { id, data }) =>
      prev.map((e) => (e.id === id ? applyEnrollmentUpdate(e, data) : e)),
    invalidateKeys: [platformKeys.planEnrollments.byPlan(planId)],
    errorMessage: "Failed to update enrollment",
  });

export const useDeletePlanEnrollment = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.planEnrollments.delete(planId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.planEnrollments.byPlan(planId),
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      toast.success("Athlete removed from plan");
    },
    onError: () => {
      toast.error("Failed to remove enrollment");
    },
  });
};
