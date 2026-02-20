"use client";

import type {
  CreateTrainingPlanData,
  GetTrainingPlansResponse,
  TrainingPlan,
  UpdateTrainingPlanData,
} from "@repo/contracts/training-plan";
import { createCrudHooks, platformKeys } from "@repo/query";

import { api } from "../api";

const trainingPlanHooks = createCrudHooks<
  GetTrainingPlansResponse,
  TrainingPlan,
  CreateTrainingPlanData,
  UpdateTrainingPlanData
>({
  entityName: "Training Plan",
  keys: platformKeys.trainingPlans,
  api: {
    getPageData: api.trainingPlans.getAll,
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
export const useUpdateTrainingPlan = trainingPlanHooks.useUpdate;
export const useDeleteTrainingPlan = trainingPlanHooks.useDelete;
