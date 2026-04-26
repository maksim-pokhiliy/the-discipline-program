import { type ApiClient } from "@repo/api-client";
import {
  type CreateBlockKindInput,
  type CreateBlockKindResponse,
  type GetBlockKindResponse,
  type ListBlockKindsQuery,
  type ListBlockKindsResponse,
  type UpdateBlockKindInput,
  type UpdateBlockKindResponse,
} from "@repo/contracts/lms/block-kind";

const toQuery = (q: ListBlockKindsQuery | undefined): Record<string, string> => {
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

export const createLibraryBlockKindsAPI = (client: ApiClient) => ({
  list: (query?: ListBlockKindsQuery): Promise<ListBlockKindsResponse> =>
    client.request("/api/platform/library/block-kinds", "GET", undefined, toQuery(query)),

  getById: (id: string): Promise<GetBlockKindResponse> =>
    client.request(`/api/platform/library/block-kinds/${id}`),

  create: (data: CreateBlockKindInput): Promise<CreateBlockKindResponse> =>
    client.request("/api/platform/library/block-kinds", "POST", data),

  update: (id: string, data: UpdateBlockKindInput): Promise<UpdateBlockKindResponse> =>
    client.request(`/api/platform/library/block-kinds/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/platform/library/block-kinds/${id}`, "DELETE"),
});
