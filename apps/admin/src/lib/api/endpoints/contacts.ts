import { type ApiClient } from "@repo/api-client";
import {
  type AdminContactsPageData,
  type GetContactByIdResponse,
  type UpdateContactRequest,
} from "@repo/contracts/cms/contact";

export const createContactsAPI = (client: ApiClient) => ({
  getPageData: (): Promise<AdminContactsPageData> =>
    client.request("/api/admin/contacts/page-data"),

  getById: (id: string): Promise<GetContactByIdResponse> =>
    client.request(`/api/admin/contacts/${id}`),

  update: (id: string, data: UpdateContactRequest): Promise<GetContactByIdResponse> =>
    client.request(`/api/admin/contacts/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/admin/contacts/${id}`, "DELETE"),
});
