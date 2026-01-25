import {
  type PageListItemDto,
  type PageSectionDto,
  type PageSlug,
  type SectionData,
  type SectionKey,
} from "@repo/contracts/pages";

import { apiClient } from "../client";

export const pagesAPI = {
  getList: (): Promise<PageListItemDto[]> => apiClient.request("/api/admin/pages"),

  getSections: (slug: string): Promise<PageSectionDto[]> =>
    apiClient.request(`/api/admin/pages/${slug}`),

  updateSection: <P extends PageSlug, S extends SectionKey<P>>(
    slug: P,
    section: S,
    data: SectionData<P, S>,
  ): Promise<PageSectionDto> =>
    apiClient.request(`/api/admin/pages/${slug}/sections/${String(section)}`, "PUT", data),
};
