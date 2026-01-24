import { type PageSection } from "@repo/contracts/pages";

import { apiClient } from "../client";

export interface PageListItem {
  slug: string;
  label: string;
}

export const pagesAPI = {
  getList: (): Promise<PageListItem[]> => apiClient.request("/api/admin/pages"),

  getSections: (slug: string): Promise<PageSection[]> =>
    apiClient.request(`/api/admin/pages/${slug}`),

  updateSection: (slug: string, section: string, data: unknown): Promise<PageSection> =>
    apiClient.request(`/api/admin/pages/${slug}/sections/${section}`, "PUT", data),
};
