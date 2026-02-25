import { type ApiClient } from "@repo/api-client";
import type {
  AdminExercisesPageData,
  CreateExerciseData,
  Exercise,
  UpdateExerciseData,
} from "@repo/contracts/exercise";

export const createExercisesAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminExercisesPageData> =>
    client.request("/api/admin/exercises/page-data"),

  getAll: (): Promise<Exercise[]> => client.request("/api/admin/exercises"),

  getById: (id: string): Promise<Exercise> => client.request(`/api/admin/exercises/${id}`),

  create: (data: CreateExerciseData): Promise<Exercise> =>
    client.request("/api/admin/exercises", "POST", data),

  update: (id: string, data: UpdateExerciseData): Promise<Exercise> =>
    client.request(`/api/admin/exercises/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`/api/admin/exercises/${id}`, "DELETE"),
});
