import { type ApiClient } from "@repo/api-client";
import {
  type CreateSessionTemplateInput,
  type CreateSessionTemplateResponse,
  type DemoteSessionTemplateInput,
  type DemoteSessionTemplateResponse,
  type GetSessionTemplateResponse,
  type ListSessionTemplatesQuery,
  type ListSessionTemplatesResponse,
  type PromoteSessionTemplateResponse,
  type UpdateSessionTemplateInput,
  type UpdateSessionTemplateResponse,
} from "@repo/contracts/lms/session-template";

const toQuery = (q: ListSessionTemplatesQuery | undefined): Record<string, string> => {
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

export const createLibrarySessionTemplatesAPI = (client: ApiClient) => ({
  list: (query?: ListSessionTemplatesQuery): Promise<ListSessionTemplatesResponse> =>
    client.request("/api/platform/library/session-templates", "GET", undefined, toQuery(query)),

  getById: (id: string): Promise<GetSessionTemplateResponse> =>
    client.request(`/api/platform/library/session-templates/${id}`),

  create: (data: CreateSessionTemplateInput): Promise<CreateSessionTemplateResponse> =>
    client.request("/api/platform/library/session-templates", "POST", data),

  update: (id: string, data: UpdateSessionTemplateInput): Promise<UpdateSessionTemplateResponse> =>
    client.request(`/api/platform/library/session-templates/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/platform/library/session-templates/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteSessionTemplateResponse> =>
    client.request(`/api/platform/library/session-templates/${id}/promote`, "POST"),

  demote: (id: string, data: DemoteSessionTemplateInput): Promise<DemoteSessionTemplateResponse> =>
    client.request(`/api/platform/library/session-templates/${id}/demote`, "POST", data),
});
