import {
  type AdminContactsPageData,
  type GetContactByIdResponse,
  type UpdateContactRequest,
} from "@repo/contracts/contact";

import { apiClient } from "../client";

export const contactsAPI = {
  getPageData: (): Promise<AdminContactsPageData> =>
    apiClient.request("/api/admin/contacts/page-data"),

  getAll: (): Promise<GetContactByIdResponse[]> => apiClient.request("/api/admin/contacts"),

  getById: (id: string): Promise<GetContactByIdResponse> =>
    apiClient.request(`/api/admin/contacts/${id}`),

  update: (id: string, data: UpdateContactRequest): Promise<GetContactByIdResponse> =>
    apiClient.request(`/api/admin/contacts/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/admin/contacts/${id}`, "DELETE"),
};
