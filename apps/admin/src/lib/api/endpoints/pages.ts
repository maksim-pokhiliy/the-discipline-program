import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
  type UpdatePageMetadataInput,
} from "@repo/contracts/pages";

import { apiClient } from "../client";

export const pagesAPI = {
  getPages: (): Promise<AdminPageListItem[]> => apiClient.request("/api/admin/pages"),

  getPageBySlug: (slug: string): Promise<AdminPageDetails> =>
    apiClient.request(`/api/admin/pages/${slug}`),

  updateMetadata: (slug: string, data: UpdatePageMetadataInput): Promise<void> =>
    apiClient.request(`/api/admin/pages/${slug}`, "PATCH", data),

  updateSection: (slug: string, data: Omit<UpdatePageSectionData, "pageSlug">): Promise<void> =>
    apiClient.request(`/api/admin/pages/${slug}/sections`, "PATCH", data),
};
