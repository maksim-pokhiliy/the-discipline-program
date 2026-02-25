import { type ApiClient } from "@repo/api-client";
import type {
  CreateExerciseCategoryData,
  ExerciseCategory,
} from "@repo/contracts/exercise-category";

export const createExerciseCategoriesAPI = (client: ApiClient) => ({
  getAll: (): Promise<ExerciseCategory[]> => client.request("/api/platform/exercise-categories"),

  create: (data: CreateExerciseCategoryData): Promise<ExerciseCategory> =>
    client.request("/api/platform/exercise-categories", "POST", data),
});
