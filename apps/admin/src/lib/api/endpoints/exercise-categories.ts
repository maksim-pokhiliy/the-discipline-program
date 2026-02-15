import type {
  CreateExerciseCategoryData,
  ExerciseCategory,
  UpdateExerciseCategoryData,
} from "@repo/contracts/exercise-category";

import { apiClient } from "../client";

export const exerciseCategoriesAPI = {
  getAll: (): Promise<ExerciseCategory[]> => apiClient.request("/api/admin/exercise-categories"),

  create: (data: CreateExerciseCategoryData): Promise<ExerciseCategory> =>
    apiClient.request("/api/admin/exercise-categories", "POST", data),

  update: (id: string, data: UpdateExerciseCategoryData): Promise<ExerciseCategory> =>
    apiClient.request(`/api/admin/exercise-categories/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    apiClient.request(`/api/admin/exercise-categories/${id}`, "DELETE"),
};
