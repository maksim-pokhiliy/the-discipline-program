import { type ApiClient } from "@repo/api-client";
import {
  type CreateExerciseLibraryItemInput,
  type CreateExerciseLibraryItemResponse,
  type DemoteExerciseLibraryItemInput,
  type DemoteExerciseLibraryItemResponse,
  type GetExerciseLibraryItemResponse,
  type ListExerciseLibraryItemsResponse,
  type PromoteExerciseLibraryItemResponse,
  type UpdateExerciseLibraryItemInput,
  type UpdateExerciseLibraryItemResponse,
} from "@repo/contracts/lms/exercise-library-item";

export const createLibraryExercisesAPI = (client: ApiClient) => ({
  list: (): Promise<ListExerciseLibraryItemsResponse> =>
    client.request("/api/admin/library/exercises"),

  getById: (id: string): Promise<GetExerciseLibraryItemResponse> =>
    client.request(`/api/admin/library/exercises/${id}`),

  create: (data: CreateExerciseLibraryItemInput): Promise<CreateExerciseLibraryItemResponse> =>
    client.request("/api/admin/library/exercises", "POST", data),

  update: (
    id: string,
    data: UpdateExerciseLibraryItemInput,
  ): Promise<UpdateExerciseLibraryItemResponse> =>
    client.request(`/api/admin/library/exercises/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/admin/library/exercises/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteExerciseLibraryItemResponse> =>
    client.request(`/api/admin/library/exercises/${id}/promote`, "POST"),

  demote: (
    id: string,
    data: DemoteExerciseLibraryItemInput,
  ): Promise<DemoteExerciseLibraryItemResponse> =>
    client.request(`/api/admin/library/exercises/${id}/demote`, "POST", data),
});
