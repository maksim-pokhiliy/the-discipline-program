"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CreatePlanOverrideBody,
  type EffectivePlanWeek,
  type ListEnrollmentOverridesResponse,
  type PlanOverride,
  type UpdatePlanOverrideInput,
} from "@repo/contracts/lms/plan-override";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useEnrollmentOverrides = (enrollmentId: string | null) =>
  useQuery<ListEnrollmentOverridesResponse>({
    queryKey: enrollmentId
      ? platformKeys.planOverrides.byEnrollment(enrollmentId)
      : ["plan-overrides", "enrollment", "disabled"],
    queryFn: () => {
      if (!enrollmentId) {
        return Promise.resolve([] satisfies ListEnrollmentOverridesResponse);
      }

      return api.planOverrides.listForEnrollment(enrollmentId);
    },
    enabled: !!enrollmentId,
  });

export const useEffectivePlan = (enrollmentId: string | null, weekIndex: number) =>
  useQuery<EffectivePlanWeek>({
    queryKey: enrollmentId
      ? platformKeys.planOverrides.effectivePlan(enrollmentId, weekIndex)
      : ["plan-overrides", "effective-plan", "disabled", weekIndex],
    queryFn: () => {
      if (!enrollmentId) {
        return Promise.reject(new Error("Effective plan requires enrollmentId"));
      }

      return api.planOverrides.getEffectivePlan(enrollmentId, weekIndex);
    },
    enabled: !!enrollmentId && Number.isInteger(weekIndex) && weekIndex >= 0,
    staleTime: 30_000,
  });

const invalidateOverrideQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  enrollmentId: string,
) => {
  queryClient.invalidateQueries({
    queryKey: platformKeys.planOverrides.byEnrollment(enrollmentId),
  });
  queryClient.invalidateQueries({
    queryKey: platformKeys.planOverrides.effectivePlanByEnrollment(enrollmentId),
  });
};

export const useCreateOverride = (enrollmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<PlanOverride, Error, CreatePlanOverrideBody>({
    mutationFn: (data) => api.planOverrides.createForEnrollment(enrollmentId, data),
    onSuccess: () => {
      invalidateOverrideQueries(queryClient, enrollmentId);
      toast.success("Override created");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create override");
    },
  });
};

type UpdateOverrideVariables = {
  overrideId: string;
  enrollmentId: string;
  data: UpdatePlanOverrideInput;
};

export const useUpdateOverride = () => {
  const queryClient = useQueryClient();

  return useMutation<PlanOverride, Error, UpdateOverrideVariables>({
    mutationFn: ({ overrideId, data }) => api.planOverrides.update(overrideId, data),
    onSuccess: (result, variables) => {
      invalidateOverrideQueries(queryClient, variables.enrollmentId);
      queryClient.setQueryData(platformKeys.planOverrides.byId(result.id), result);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update override");
    },
  });
};

type DeleteOverrideVariables = {
  overrideId: string;
  enrollmentId: string;
};

export const useDeleteOverride = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteOverrideVariables>({
    mutationFn: ({ overrideId }) => api.planOverrides.delete(overrideId),
    onSuccess: (_void, variables) => {
      invalidateOverrideQueries(queryClient, variables.enrollmentId);
      toast.success("Override removed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove override");
    },
  });
};
