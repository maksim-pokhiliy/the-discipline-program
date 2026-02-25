import { type ApiClient } from "@repo/api-client";
import type {
  CreateExerciseCategoryData,
  ExerciseCategory,
  UpdateExerciseCategoryData,
} from "@repo/contracts/exercise-category";

export const createExerciseCategoriesAPI = (client: ApiClient) => ({
  getAll: (): Promise<ExerciseCategory[]> => client.request("/api/admin/exercise-categories"),

  create: (data: CreateExerciseCategoryData): Promise<ExerciseCategory> =>
    client.request("/api/admin/exercise-categories", "POST", data),

  update: (id: string, data: UpdateExerciseCategoryData): Promise<ExerciseCategory> =>
    client.request(`/api/admin/exercise-categories/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/admin/exercise-categories/${id}`, "DELETE"),
});
