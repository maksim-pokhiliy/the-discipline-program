import type {
  CreateExerciseCategoryData,
  ExerciseCategory,
} from "@repo/contracts/exercise-category";

import { apiClient } from "../client";

export const exerciseCategoriesAPI = {
  getAll: (): Promise<ExerciseCategory[]> => apiClient.request("/api/platform/exercise-categories"),

  create: (data: CreateExerciseCategoryData): Promise<ExerciseCategory> =>
    apiClient.request("/api/platform/exercise-categories", "POST", data),
};
