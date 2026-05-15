import { type ApiClient } from "@repo/api-client";
import {
  type AdminExercisesPageData,
  type CreateExerciseData,
  type Exercise,
  type GetMovementFamiliesResponse,
  type UpdateExerciseData,
} from "@repo/contracts/cms/exercise";

export const createExercisesAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminExercisesPageData> =>
    client.request("/api/admin/exercises/page-data"),

  getById: (id: string): Promise<Exercise> => client.request(`/api/admin/exercises/${id}`),

  create: (data: CreateExerciseData): Promise<Exercise> =>
    client.request("/api/admin/exercises", "POST", data),

  update: (id: string, data: UpdateExerciseData): Promise<Exercise> =>
    client.request(`/api/admin/exercises/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/exercises/${id}`, "DELETE"),

  getMovementFamilies: (): Promise<GetMovementFamiliesResponse> =>
    client.request("/api/admin/exercises/movement-families"),
});
