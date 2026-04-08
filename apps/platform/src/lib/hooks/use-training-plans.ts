"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type {
  CoachPlansPageData,
  CreateTrainingPlanData,
  TrainingPlan,
  UpdateTrainingPlanData,
} from "@repo/contracts/training-plan";
import { createCrudHooks, useOptimisticMutation } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const useNavigate = () => useRouter().push;

const trainingPlanHooks = createCrudHooks<
  CoachPlansPageData,
  TrainingPlan,
  CreateTrainingPlanData,
  UpdateTrainingPlanData
>({
  entityName: "Training Plan",
  keys: platformKeys.trainingPlans,
  api: {
    getPageData: api.trainingPlans.getPageData,
    getById: api.trainingPlans.getById,
    create: api.trainingPlans.create,
    update: api.trainingPlans.update,
    delete: api.trainingPlans.delete,
  },
  redirectTo: "/coach/plans",
  useNavigate,
  additionalInvalidateKeys: [platformKeys.coachDashboard.data()],
});

export const useTrainingPlansPageData = trainingPlanHooks.usePageData;
export const useTrainingPlan = trainingPlanHooks.useById;
export const useCreateTrainingPlan = trainingPlanHooks.useCreate;
export const useDeleteTrainingPlan = trainingPlanHooks.useDelete;

export const useUpdateTrainingPlan = () =>
  useOptimisticMutation<TrainingPlan, { id: string; data: UpdateTrainingPlanData }>({
    mutationFn: ({ id, data }) => api.trainingPlans.update(id, data),
    queryKey: ({ id }) => platformKeys.trainingPlans.byId(id),
    transform: (prev, { data }) => ({ ...prev, ...data }),
    invalidateKeys: ({ id }) => [
      platformKeys.trainingPlans.byId(id),
      platformKeys.trainingPlans.page(),
      platformKeys.coachDashboard.data(),
    ],
    errorMessage: "Failed to update training plan",
  });

export const useDuplicateTrainingPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.trainingPlans.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.invalidateQueries({ queryKey: platformKeys.coachDashboard.data() });
      toast.success("Training plan duplicated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to duplicate training plan");
    },
  });
};

const useStatusMutation = ({
  mutationFn,
  successMessage,
  errorMessage,
}: {
  mutationFn: (id: string) => Promise<TrainingPlan>;
  successMessage: string;
  errorMessage: string;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.invalidateQueries({ queryKey: platformKeys.coachDashboard.data() });
      queryClient.setQueryData(platformKeys.trainingPlans.byId(plan.id), plan);
      toast.success(successMessage);
    },
    onError: (error: Error) => {
      toast.error(error.message || errorMessage);
    },
  });
};

export const useArchiveTrainingPlan = () =>
  useStatusMutation({
    mutationFn: (id) => api.trainingPlans.archive(id),
    successMessage: "Training plan archived",
    errorMessage: "Failed to archive training plan",
  });

export const useRestoreTrainingPlan = () =>
  useStatusMutation({
    mutationFn: (id) => api.trainingPlans.restore(id),
    successMessage: "Training plan restored",
    errorMessage: "Failed to restore training plan",
  });

export const useActivateTrainingPlan = () =>
  useStatusMutation({
    mutationFn: (id) => api.trainingPlans.activate(id),
    successMessage: "Training plan activated",
    errorMessage: "Failed to activate training plan",
  });
