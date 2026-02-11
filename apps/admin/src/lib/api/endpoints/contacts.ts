import {
  type AdminContactsPageData,
  type GetContactByIdResponse,
  type UpdateContactStatusRequest,
} from "@repo/contracts/contact";

import { apiClient } from "../client";

export const contactsAPI = {
  getPageData: (): Promise<AdminContactsPageData> =>
    apiClient.request("/api/admin/contacts/page-data"),

  getAll: (): Promise<GetContactByIdResponse[]> => apiClient.request("/api/admin/contacts"),

  getById: (id: string): Promise<GetContactByIdResponse> =>
    apiClient.request(`/api/admin/contacts/${id}`),

  updateStatus: (id: string, data: UpdateContactStatusRequest): Promise<GetContactByIdResponse> =>
    apiClient.request(`/api/admin/contacts/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/admin/contacts/${id}`, "DELETE"),
};
