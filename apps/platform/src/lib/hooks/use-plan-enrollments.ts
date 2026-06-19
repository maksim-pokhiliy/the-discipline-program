"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreatePlanEnrollmentRequest,
  CreatePlanEnrollmentResponse,
} from "@repo/contracts/lms/plan-enrollment";
import { notifyError } from "@repo/query";
import { formatDateParam } from "@repo/shared";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const toBoardedAt = (pickerDate: Date): Date =>
  new Date(`${formatDateParam(pickerDate)}T00:00:00.000Z`);

export const usePlanEnrollments = (planId: string) =>
  useQuery({
    queryKey: platformKeys.planEnrollments.byPlan(planId),
    queryFn: async () => (await api.planEnrollments.listByPlan(planId)).enrollments,
    enabled: !!planId,
  });

const useInvalidateEnrollmentCaches = (planId: string) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: platformKeys.planEnrollments.byPlan(planId),
    });
    queryClient.invalidateQueries({ queryKey: platformKeys.athletes.page() });
  };
};

export const useCreateEnrollment = (planId: string) =>
  useMutation<CreatePlanEnrollmentResponse, Error, CreatePlanEnrollmentRequest>({
    mutationFn: (data) => api.planEnrollments.create(planId, data),
  });

const useEnrollmentStatusMutation = <TResult>({
  planId,
  mutationFn,
  successMessage,
  errorMessage,
}: {
  planId: string;
  mutationFn: (enrollmentId: string) => Promise<TResult>;
  successMessage: string;
  errorMessage: string;
}) => {
  const invalidateEnrollmentCaches = useInvalidateEnrollmentCaches(planId);

  return useMutation<TResult, Error, string>({
    mutationFn,
    onSuccess: () => {
      invalidateEnrollmentCaches();
      toast.success(successMessage);
    },
    onError: (error) => {
      notifyError(error, errorMessage);
    },
  });
};

export const usePauseEnrollment = (planId: string) =>
  useEnrollmentStatusMutation({
    planId,
    mutationFn: (enrollmentId) => api.planEnrollments.pause(planId, enrollmentId),
    successMessage: "Enrollment paused",
    errorMessage: "Couldn't pause — try again.",
  });

export const useResumeEnrollment = (planId: string) =>
  useEnrollmentStatusMutation({
    planId,
    mutationFn: (enrollmentId) => api.planEnrollments.resume(planId, enrollmentId),
    successMessage: "Enrollment resumed",
    errorMessage: "Couldn't resume — try again.",
  });

export const useRemoveEnrollment = (planId: string) =>
  useEnrollmentStatusMutation<void>({
    planId,
    mutationFn: (enrollmentId) => api.planEnrollments.remove(planId, enrollmentId),
    successMessage: "Removed from plan",
    errorMessage: "Couldn't remove — try again.",
  });
