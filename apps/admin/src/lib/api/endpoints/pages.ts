import { type ApiClient } from "@repo/api-client";
import { type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminPageListItem,
  type AdminPageDetails,
  type LocalizedSectionWriteBody,
} from "@repo/contracts/cms/pages";

export const createPagesAPI = (client: ApiClient) => ({
  getPages: (locale: LocaleCode): Promise<AdminPageListItem[]> =>
    client.request("/api/admin/pages", "GET", undefined, { locale }),

  getPageBySlug: (slug: string, locale: LocaleCode): Promise<AdminPageDetails> =>
    client.request(`/api/admin/pages/${slug}`, "GET", undefined, { locale }),

  updateSection: (slug: string, body: LocalizedSectionWriteBody): Promise<void> =>
    client.requestNoContent(`/api/admin/pages/${slug}/sections`, "PATCH", body),
});
