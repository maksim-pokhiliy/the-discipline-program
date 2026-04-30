import { type ApiClient } from "@repo/api-client";
import {
  type CreateBlockTemplateInput,
  type CreateBlockTemplateResponse,
  type DemoteBlockTemplateInput,
  type DemoteBlockTemplateResponse,
  type GetBlockTemplateResponse,
  type ListBlockTemplatesQuery,
  type ListBlockTemplatesResponse,
  type PromoteBlockTemplateResponse,
  type UpdateBlockTemplateInput,
  type UpdateBlockTemplateResponse,
} from "@repo/contracts/lms/block-template";

const toQuery = (q: ListBlockTemplatesQuery | undefined): Record<string, string> => {
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

export const createLibraryBlockTemplatesAPI = (client: ApiClient) => ({
  list: (query?: ListBlockTemplatesQuery): Promise<ListBlockTemplatesResponse> =>
    client.request("/api/platform/library/block-templates", "GET", undefined, toQuery(query)),

  getById: (id: string): Promise<GetBlockTemplateResponse> =>
    client.request(`/api/platform/library/block-templates/${id}`),

  create: (data: CreateBlockTemplateInput): Promise<CreateBlockTemplateResponse> =>
    client.request("/api/platform/library/block-templates", "POST", data),

  update: (id: string, data: UpdateBlockTemplateInput): Promise<UpdateBlockTemplateResponse> =>
    client.request(`/api/platform/library/block-templates/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/platform/library/block-templates/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteBlockTemplateResponse> =>
    client.request(`/api/platform/library/block-templates/${id}/promote`, "POST"),

  demote: (id: string, data: DemoteBlockTemplateInput): Promise<DemoteBlockTemplateResponse> =>
    client.request(`/api/platform/library/block-templates/${id}/demote`, "POST", data),
});
