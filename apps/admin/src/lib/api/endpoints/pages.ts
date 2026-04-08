import { type ApiClient } from "@repo/api-client";
import {
  type AdminPageListItem,
  type AdminPageDetails,
  type UpdatePageSectionData,
} from "@repo/contracts/pages";

export const createPagesAPI = (client: ApiClient) => ({
  getPages: (): Promise<AdminPageListItem[]> => client.request("/api/admin/pages"),

  getPageBySlug: (slug: string): Promise<AdminPageDetails> =>
    client.request(`/api/admin/pages/${slug}`),

  updateSection: (slug: string, data: Omit<UpdatePageSectionData, "pageSlug">): Promise<void> =>
    client.request(`/api/admin/pages/${slug}/sections`, "PATCH", data),
});
