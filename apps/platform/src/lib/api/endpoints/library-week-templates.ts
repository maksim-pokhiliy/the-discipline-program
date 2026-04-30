import { type ApiClient } from "@repo/api-client";
import {
  type CreateWeekTemplateInput,
  type CreateWeekTemplateResponse,
  type DemoteWeekTemplateInput,
  type DemoteWeekTemplateResponse,
  type GetWeekTemplateResponse,
  type ListWeekTemplatesQuery,
  type ListWeekTemplatesResponse,
  type PromoteWeekTemplateResponse,
  type UpdateWeekTemplateInput,
  type UpdateWeekTemplateResponse,
} from "@repo/contracts/lms/week-template";

const toQuery = (q: ListWeekTemplatesQuery | undefined): Record<string, string> => {
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

export const createLibraryWeekTemplatesAPI = (client: ApiClient) => ({
  list: (query?: ListWeekTemplatesQuery): Promise<ListWeekTemplatesResponse> =>
    client.request("/api/platform/library/week-templates", "GET", undefined, toQuery(query)),

  getById: (id: string): Promise<GetWeekTemplateResponse> =>
    client.request(`/api/platform/library/week-templates/${id}`),

  create: (data: CreateWeekTemplateInput): Promise<CreateWeekTemplateResponse> =>
    client.request("/api/platform/library/week-templates", "POST", data),

  update: (id: string, data: UpdateWeekTemplateInput): Promise<UpdateWeekTemplateResponse> =>
    client.request(`/api/platform/library/week-templates/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/platform/library/week-templates/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteWeekTemplateResponse> =>
    client.request(`/api/platform/library/week-templates/${id}/promote`, "POST"),

  demote: (id: string, data: DemoteWeekTemplateInput): Promise<DemoteWeekTemplateResponse> =>
    client.request(`/api/platform/library/week-templates/${id}/demote`, "POST", data),
});
