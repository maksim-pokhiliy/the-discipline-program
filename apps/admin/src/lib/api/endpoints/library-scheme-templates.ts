import { type ApiClient } from "@repo/api-client";
import {
  type CreateSchemeTemplateInput,
  type CreateSchemeTemplateResponse,
  type DemoteSchemeTemplateInput,
  type DemoteSchemeTemplateResponse,
  type GetSchemeTemplateResponse,
  type ListSchemeTemplatesResponse,
  type PromoteSchemeTemplateResponse,
  type UpdateSchemeTemplateInput,
  type UpdateSchemeTemplateResponse,
} from "@repo/contracts/lms/scheme-template";

export const createLibrarySchemeTemplatesAPI = (client: ApiClient) => ({
  list: (): Promise<ListSchemeTemplatesResponse> =>
    client.request("/api/admin/library/scheme-templates"),

  getById: (id: string): Promise<GetSchemeTemplateResponse> =>
    client.request(`/api/admin/library/scheme-templates/${id}`),

  create: (data: CreateSchemeTemplateInput): Promise<CreateSchemeTemplateResponse> =>
    client.request("/api/admin/library/scheme-templates", "POST", data),

  update: (id: string, data: UpdateSchemeTemplateInput): Promise<UpdateSchemeTemplateResponse> =>
    client.request(`/api/admin/library/scheme-templates/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/admin/library/scheme-templates/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteSchemeTemplateResponse> =>
    client.request(`/api/admin/library/scheme-templates/${id}/promote`, "POST"),

  demote: (id: string, data: DemoteSchemeTemplateInput): Promise<DemoteSchemeTemplateResponse> =>
    client.request(`/api/admin/library/scheme-templates/${id}/demote`, "POST", data),
});
