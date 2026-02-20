import type {
  CoachPlansPageData,
  CreateTrainingPlanData,
  TrainingPlan,
  UpdateTrainingPlanData,
} from "@repo/contracts/training-plan";

import { apiClient } from "../client";

export const trainingPlansAPI = {
  getPageData: (): Promise<CoachPlansPageData> => apiClient.request("/api/platform/training-plans"),

  getById: (id: string): Promise<TrainingPlan> =>
    apiClient.request(`/api/platform/training-plans/${id}`),

  create: (data: CreateTrainingPlanData): Promise<TrainingPlan> =>
    apiClient.request("/api/platform/training-plans", "POST", data),

  update: (id: string, data: UpdateTrainingPlanData): Promise<TrainingPlan> =>
    apiClient.request(`/api/platform/training-plans/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    apiClient.request(`/api/platform/training-plans/${id}`, "DELETE"),

  duplicate: (id: string): Promise<TrainingPlan> =>
    apiClient.request(`/api/platform/training-plans/${id}/duplicate`, "POST"),

  archive: (id: string): Promise<TrainingPlan> =>
    apiClient.request(`/api/platform/training-plans/${id}/archive`, "POST"),

  restore: (id: string): Promise<TrainingPlan> =>
    apiClient.request(`/api/platform/training-plans/${id}/restore`, "POST"),

  activate: (id: string): Promise<TrainingPlan> =>
    apiClient.request(`/api/platform/training-plans/${id}/activate`, "POST"),
};
