"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CoachPlansPageData,
  CreateTrainingPlanData,
  TrainingPlan,
  UpdateTrainingPlanData,
} from "@repo/contracts/training-plan";
import { createCrudHooks, platformKeys } from "@repo/query";

import { api } from "../api";

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
});

export const useTrainingPlansPageData = trainingPlanHooks.usePageData;
export const useTrainingPlan = trainingPlanHooks.useById;
export const useCreateTrainingPlan = trainingPlanHooks.useCreate;
export const useDeleteTrainingPlan = trainingPlanHooks.useDelete;

export const useUpdateTrainingPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTrainingPlanData }) =>
      api.trainingPlans.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: platformKeys.trainingPlans.byId(id) });

      const previous = queryClient.getQueryData<TrainingPlan>(platformKeys.trainingPlans.byId(id));

      if (previous) {
        queryClient.setQueryData(platformKeys.trainingPlans.byId(id), { ...previous, ...data });
      }

      return { previous };
    },
    onError: (_error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(platformKeys.trainingPlans.byId(id), context.previous);
      }

      toast.error("Failed to update training plan");
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.byId(id) });
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
    },
  });
};

export const useDuplicateTrainingPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.trainingPlans.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      toast.success("Training plan duplicated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to duplicate training plan");
    },
  });
};

export const useArchiveTrainingPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.trainingPlans.archive(id),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.setQueryData(platformKeys.trainingPlans.byId(plan.id), plan);
      toast.success("Training plan archived");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to archive training plan");
    },
  });
};

export const useRestoreTrainingPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.trainingPlans.restore(id),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.setQueryData(platformKeys.trainingPlans.byId(plan.id), plan);
      toast.success("Training plan restored");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to restore training plan");
    },
  });
};

export const useActivateTrainingPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.trainingPlans.activate(id),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.page() });
      queryClient.setQueryData(platformKeys.trainingPlans.byId(plan.id), plan);
      toast.success("Training plan activated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to activate training plan");
    },
  });
};
