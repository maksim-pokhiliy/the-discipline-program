import { type ApiClient } from "@repo/api-client";
import type { CreateExerciseData, Exercise, UpdateExerciseData } from "@repo/contracts/exercise";

export const createExercisesAPI = (client: ApiClient) => ({
  getAll: (): Promise<Exercise[]> => client.request("/api/platform/exercises"),

  getById: (id: string): Promise<Exercise> => client.request(`/api/platform/exercises/${id}`),

  create: (data: CreateExerciseData): Promise<Exercise> =>
    client.request("/api/platform/exercises", "POST", data),

  update: (id: string, data: UpdateExerciseData): Promise<Exercise> =>
    client.request(`/api/platform/exercises/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`/api/platform/exercises/${id}`, "DELETE"),
});
