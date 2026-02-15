import type {
  AdminExercisesPageData,
  CreateExerciseData,
  Exercise,
  UpdateExerciseData,
} from "@repo/contracts/exercise";

import { apiClient } from "../client";

export const exercisesAPI = {
  getPageData: (): Promise<AdminExercisesPageData> =>
    apiClient.request("/api/admin/exercises/page-data"),

  getAll: (): Promise<Exercise[]> => apiClient.request("/api/admin/exercises"),

  getById: (id: string): Promise<Exercise> => apiClient.request(`/api/admin/exercises/${id}`),

  create: (data: CreateExerciseData): Promise<Exercise> =>
    apiClient.request("/api/admin/exercises", "POST", data),

  update: (id: string, data: UpdateExerciseData): Promise<Exercise> =>
    apiClient.request(`/api/admin/exercises/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/admin/exercises/${id}`, "DELETE"),
};
