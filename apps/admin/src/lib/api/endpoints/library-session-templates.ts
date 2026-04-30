import { type ApiClient } from "@repo/api-client";
import {
  type CreateSessionTemplateInput,
  type CreateSessionTemplateResponse,
  type DemoteSessionTemplateInput,
  type DemoteSessionTemplateResponse,
  type GetSessionTemplateResponse,
  type ListSessionTemplatesResponse,
  type PromoteSessionTemplateResponse,
  type UpdateSessionTemplateInput,
  type UpdateSessionTemplateResponse,
} from "@repo/contracts/lms/session-template";

export const createLibrarySessionTemplatesAPI = (client: ApiClient) => ({
  list: (): Promise<ListSessionTemplatesResponse> =>
    client.request("/api/admin/library/session-templates"),

  getById: (id: string): Promise<GetSessionTemplateResponse> =>
    client.request(`/api/admin/library/session-templates/${id}`),

  create: (data: CreateSessionTemplateInput): Promise<CreateSessionTemplateResponse> =>
    client.request("/api/admin/library/session-templates", "POST", data),

  update: (id: string, data: UpdateSessionTemplateInput): Promise<UpdateSessionTemplateResponse> =>
    client.request(`/api/admin/library/session-templates/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/library/session-templates/${id}`, "DELETE"),

  promote: (id: string): Promise<PromoteSessionTemplateResponse> =>
    client.request(`/api/admin/library/session-templates/${id}/promote`, "POST"),

  demote: (id: string, data: DemoteSessionTemplateInput): Promise<DemoteSessionTemplateResponse> =>
    client.request(`/api/admin/library/session-templates/${id}/demote`, "POST", data),
});
