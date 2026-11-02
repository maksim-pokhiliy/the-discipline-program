import { type ApiClient } from "@repo/api-client";
import {
  type AdminPageListItem,
  type CorrelatedAdminPageDetails,
  type UpdatePageSectionBody,
} from "@repo/contracts/cms/pages";

export const createPagesAPI = (client: ApiClient) => ({
  getPages: (): Promise<AdminPageListItem[]> => client.request("/api/admin/pages"),

  getPageBySlug: (slug: string): Promise<CorrelatedAdminPageDetails> =>
    client.request(`/api/admin/pages/${slug}`),

  updateSection: (slug: string, body: UpdatePageSectionBody): Promise<void> =>
    client.requestNoContent(`/api/admin/pages/${slug}/sections`, "PATCH", body),
});
