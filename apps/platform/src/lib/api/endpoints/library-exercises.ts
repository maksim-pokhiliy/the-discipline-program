import { type ApiClient } from "@repo/api-client";
import {
  type CreateExerciseLibraryItemInput,
  type CreateExerciseLibraryItemResponse,
  type DemoteExerciseLibraryItemInput,
  type DemoteExerciseLibraryItemResponse,
  type GetExerciseLibraryItemResponse,
  type ListExerciseLibraryItemsQuery,
  type ListExerciseLibraryItemsResponse,
  type PromoteExerciseLibraryItemResponse,
  type UpdateExerciseLibraryItemInput,
  type UpdateExerciseLibraryItemResponse,
} from "@repo/contracts/lms/exercise-library-item";

const toQuery = (q: ListExerciseLibraryItemsQuery | undefined): Record<string, string> => {
  const out: Record<string, string> = {};

  if (!q) {
    return out;
  }

  if (q.scope) {
    out.scope = q.scope;
  }

  if (q.ownerId) {
    out.ownerId = q.ownerId;
  }

  if (q.primaryMovement) {
    out.primaryMovement = q.primaryMovement;
  }

  if (q.modality) {
    out.modality = q.modality;
  }

  if (q.isBenchmark !== undefined) {
    out.isBenchmark = String(q.isBenchmark);
  }

  if (q.search) {
    out.search = q.search;
  }

  if (q.includeDeleted !== undefined) {
    out.includeDeleted = String(q.includeDeleted);
  }

  if (q.take !== undefined) {
    out.take = String(q.take);
  }

  return out;
};

export const createLibraryExercisesAPI = (client: ApiClient) => ({
  list: (query?: ListExerciseLibraryItemsQuery): Promise<ListExerciseLibraryItemsResponse> =>
    client.request("/api/platform/library/exercises", "GET", undefined, toQuery(query)),

  getById: (id: string): Promise<GetExerciseLibraryItemResponse> =>
    client.request(`/api/platform/library/exercises/${id}`),

  create: (data: CreateExerciseLibraryItemInput): Promise<CreateExerciseLibraryItemResponse> =>
    client.request("/api/platform/library/exercises", "POST", data),

  update: (
    id: string,
    data: UpdateExerciseLibraryItemInput,
  ): Promise<UpdateExerciseLibraryItemResponse> =>
    client.request(`/api/platform/library/exercises/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/platform/library/exercises/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteExerciseLibraryItemResponse> =>
    client.request(`/api/platform/library/exercises/${id}/promote`, "POST"),

  demote: (
    id: string,
    data: DemoteExerciseLibraryItemInput,
  ): Promise<DemoteExerciseLibraryItemResponse> =>
    client.request(`/api/platform/library/exercises/${id}/demote`, "POST", data),
});
