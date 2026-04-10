import { type ApiClient } from "@repo/api-client";
import type {
  CoachPlansPageData,
  CreateTrainingPlanData,
  TrainingPlan,
  UpdateTrainingPlanData,
} from "@repo/contracts/lms/training-plan";

export const createTrainingPlansAPI = (client: ApiClient) => ({
  getPageData: (): Promise<CoachPlansPageData> => client.request("/api/platform/training-plans"),

  getById: (id: string): Promise<TrainingPlan> =>
    client.request(`/api/platform/training-plans/${id}`),

  create: (data: CreateTrainingPlanData): Promise<TrainingPlan> =>
    client.request("/api/platform/training-plans", "POST", data),

  update: (id: string, data: UpdateTrainingPlanData): Promise<TrainingPlan> =>
    client.request(`/api/platform/training-plans/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/platform/training-plans/${id}`, "DELETE"),

  duplicate: (id: string): Promise<TrainingPlan> =>
    client.request(`/api/platform/training-plans/${id}/duplicate`, "POST"),

  archive: (id: string): Promise<TrainingPlan> =>
    client.request(`/api/platform/training-plans/${id}/archive`, "POST"),

  restore: (id: string): Promise<TrainingPlan> =>
    client.request(`/api/platform/training-plans/${id}/restore`, "POST"),

  activate: (id: string): Promise<TrainingPlan> =>
    client.request(`/api/platform/training-plans/${id}/activate`, "POST"),
});
