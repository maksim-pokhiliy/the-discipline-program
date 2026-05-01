import { type ApiClient } from "@repo/api-client";
import {
  type CreateBlockTemplateInput,
  type CreateBlockTemplateResponse,
  type DemoteBlockTemplateInput,
  type DemoteBlockTemplateResponse,
  type GetBlockTemplateResponse,
  type ListBlockTemplatesResponse,
  type PromoteBlockTemplateResponse,
  type UpdateBlockTemplateInput,
  type UpdateBlockTemplateResponse,
} from "@repo/contracts/lms/block-template";

export const createLibraryBlockTemplatesAPI = (client: ApiClient) => ({
  list: (): Promise<ListBlockTemplatesResponse> =>
    client.request("/api/admin/library/block-templates"),

  getById: (id: string): Promise<GetBlockTemplateResponse> =>
    client.request(`/api/admin/library/block-templates/${id}`),

  create: (data: CreateBlockTemplateInput): Promise<CreateBlockTemplateResponse> =>
    client.request("/api/admin/library/block-templates", "POST", data),

  update: (id: string, data: UpdateBlockTemplateInput): Promise<UpdateBlockTemplateResponse> =>
    client.request(`/api/admin/library/block-templates/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/library/block-templates/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteBlockTemplateResponse> =>
    client.request(`/api/admin/library/block-templates/${id}/promote`, "POST"),

  demote: (id: string, data: DemoteBlockTemplateInput): Promise<DemoteBlockTemplateResponse> =>
    client.request(`/api/admin/library/block-templates/${id}/demote`, "POST", data),
});
