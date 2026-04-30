import { type ApiClient } from "@repo/api-client";
import {
  type CreateWeekTemplateInput,
  type CreateWeekTemplateResponse,
  type DemoteWeekTemplateInput,
  type DemoteWeekTemplateResponse,
  type GetWeekTemplateResponse,
  type ListWeekTemplatesResponse,
  type PromoteWeekTemplateResponse,
  type UpdateWeekTemplateInput,
  type UpdateWeekTemplateResponse,
} from "@repo/contracts/lms/week-template";

export const createLibraryWeekTemplatesAPI = (client: ApiClient) => ({
  list: (): Promise<ListWeekTemplatesResponse> =>
    client.request("/api/admin/library/week-templates"),

  getById: (id: string): Promise<GetWeekTemplateResponse> =>
    client.request(`/api/admin/library/week-templates/${id}`),

  create: (data: CreateWeekTemplateInput): Promise<CreateWeekTemplateResponse> =>
    client.request("/api/admin/library/week-templates", "POST", data),

  update: (id: string, data: UpdateWeekTemplateInput): Promise<UpdateWeekTemplateResponse> =>
    client.request(`/api/admin/library/week-templates/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/admin/library/week-templates/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteWeekTemplateResponse> =>
    client.request(`/api/admin/library/week-templates/${id}/promote`, "POST"),

  demote: (id: string, data: DemoteWeekTemplateInput): Promise<DemoteWeekTemplateResponse> =>
    client.request(`/api/admin/library/week-templates/${id}/demote`, "POST", data),
});
