import type { CreateExerciseData, Exercise, UpdateExerciseData } from "@repo/contracts/exercise";

import { apiClient } from "../client";

export const exercisesAPI = {
  getAll: (): Promise<Exercise[]> => apiClient.request("/api/platform/exercises"),

  getById: (id: string): Promise<Exercise> => apiClient.request(`/api/platform/exercises/${id}`),

  create: (data: CreateExerciseData): Promise<Exercise> =>
    apiClient.request("/api/platform/exercises", "POST", data),

  update: (id: string, data: UpdateExerciseData): Promise<Exercise> =>
    apiClient.request(`/api/platform/exercises/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    apiClient.request(`/api/platform/exercises/${id}`, "DELETE"),
};
