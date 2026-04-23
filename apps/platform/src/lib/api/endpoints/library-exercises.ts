import { type ApiClient } from "@repo/api-client";
import type {
  CreateExerciseData,
  Exercise,
  GetExercisesQuery,
  GetExercisesResponse,
  GetMyExercisesResponse,
  UpdateExerciseData,
} from "@repo/contracts/library/exercise";

const BASE = "/api/platform/library/exercises";

const toQueryRecord = (query: GetExercisesQuery): Record<string, string> => {
  const record: Record<string, string> = {};

  if (query.search !== undefined) {
    record.search = query.search;
  }

  if (query.status !== undefined) {
    record.status = query.status;
  }

  if (query.includeOwnDrafts !== undefined) {
    record.includeOwnDrafts = String(query.includeOwnDrafts);
  }

  if (query.createdByUserId !== undefined) {
    record.createdByUserId = query.createdByUserId;
  }

  if (query.page !== undefined) {
    record.page = String(query.page);
  }

  if (query.limit !== undefined) {
    record.limit = String(query.limit);
  }

  return record;
};

export const createLibraryExercisesAPI = (client: ApiClient) => ({
  list: (query: GetExercisesQuery = {}): Promise<GetExercisesResponse> =>
    client.request(BASE, "GET", undefined, toQueryRecord(query)),

  listMine: (query: GetExercisesQuery = {}): Promise<GetMyExercisesResponse> =>
    client.request(`${BASE}/mine`, "GET", undefined, toQueryRecord(query)),

  getById: (id: string): Promise<Exercise> => client.request(`${BASE}/${id}`),

  create: (data: CreateExerciseData): Promise<Exercise> => client.request(BASE, "POST", data),

  update: (id: string, data: UpdateExerciseData): Promise<Exercise> =>
    client.request(`${BASE}/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => client.request(`${BASE}/${id}`, "DELETE"),
});
