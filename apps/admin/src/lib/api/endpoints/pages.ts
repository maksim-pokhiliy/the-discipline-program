import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
} from "@repo/contracts/pages";

import { apiClient } from "../client";

export const pagesAPI = {
  getPages: (): Promise<AdminPageListItem[]> => apiClient.request("/api/admin/pages"),

  getPageBySlug: (slug: string): Promise<AdminPageDetails> =>
    apiClient.request(`/api/admin/pages/${slug}`),

  updateSection: (slug: string, data: Omit<UpdatePageSectionData, "pageSlug">): Promise<void> =>
    apiClient.request(`/api/admin/pages/${slug}/sections`, "PATCH", data),
};
