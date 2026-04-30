import { type ApiClient } from "@repo/api-client";
import {
  type CreateSchemeTemplateInput,
  type CreateSchemeTemplateResponse,
  type DemoteSchemeTemplateInput,
  type DemoteSchemeTemplateResponse,
  type GetSchemeTemplateResponse,
  type ListSchemeTemplatesQuery,
  type ListSchemeTemplatesResponse,
  type PromoteSchemeTemplateResponse,
  type UpdateSchemeTemplateInput,
  type UpdateSchemeTemplateResponse,
} from "@repo/contracts/lms/scheme-template";

const toQuery = (q: ListSchemeTemplatesQuery | undefined): Record<string, string> => {
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

  if (q.archetypeKind) {
    out.archetypeKind = q.archetypeKind;
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

export const createLibrarySchemeTemplatesAPI = (client: ApiClient) => ({
  list: (query?: ListSchemeTemplatesQuery): Promise<ListSchemeTemplatesResponse> =>
    client.request("/api/platform/library/scheme-templates", "GET", undefined, toQuery(query)),

  getById: (id: string): Promise<GetSchemeTemplateResponse> =>
    client.request(`/api/platform/library/scheme-templates/${id}`),

  create: (data: CreateSchemeTemplateInput): Promise<CreateSchemeTemplateResponse> =>
    client.request("/api/platform/library/scheme-templates", "POST", data),

  update: (id: string, data: UpdateSchemeTemplateInput): Promise<UpdateSchemeTemplateResponse> =>
    client.request(`/api/platform/library/scheme-templates/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/platform/library/scheme-templates/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteSchemeTemplateResponse> =>
    client.request(`/api/platform/library/scheme-templates/${id}/promote`, "POST"),

  demote: (id: string, data: DemoteSchemeTemplateInput): Promise<DemoteSchemeTemplateResponse> =>
    client.request(`/api/platform/library/scheme-templates/${id}/demote`, "POST", data),
});
