import { type ApiClient } from "@repo/api-client";
import {
  type CreateBlockKindInput,
  type CreateBlockKindResponse,
  type DemoteBlockKindInput,
  type DemoteBlockKindResponse,
  type GetBlockKindResponse,
  type ListBlockKindsResponse,
  type PromoteBlockKindResponse,
  type UpdateBlockKindInput,
  type UpdateBlockKindResponse,
} from "@repo/contracts/lms/block-kind";

export const createLibraryBlockKindsAPI = (client: ApiClient) => ({
  list: (): Promise<ListBlockKindsResponse> => client.request("/api/admin/library/block-kinds"),

  getById: (id: string): Promise<GetBlockKindResponse> =>
    client.request(`/api/admin/library/block-kinds/${id}`),

  create: (data: CreateBlockKindInput): Promise<CreateBlockKindResponse> =>
    client.request("/api/admin/library/block-kinds", "POST", data),

  update: (id: string, data: UpdateBlockKindInput): Promise<UpdateBlockKindResponse> =>
    client.request(`/api/admin/library/block-kinds/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/library/block-kinds/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteBlockKindResponse> =>
    client.request(`/api/admin/library/block-kinds/${id}/promote`, "POST"),

  demote: (id: string, data: DemoteBlockKindInput): Promise<DemoteBlockKindResponse> =>
    client.request(`/api/admin/library/block-kinds/${id}/demote`, "POST", data),
});
