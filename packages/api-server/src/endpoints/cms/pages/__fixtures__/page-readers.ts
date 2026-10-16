import { type LocaleCode } from "@repo/contracts/cms/locale";
import { PageSlug } from "@repo/contracts/cms/pages";

import { cmsPagesPublicApi } from "../public";

export type PageReader = (locale: LocaleCode) => Promise<{ hero: unknown }>;

export const PAGE_READERS: readonly (readonly [PageSlug, PageReader])[] = [
  [PageSlug.HOME, cmsPagesPublicApi.getHomePage],
  [PageSlug.STOREFRONT, cmsPagesPublicApi.getStorefrontProgramsPage],
  [PageSlug.ABOUT, cmsPagesPublicApi.getAboutPage],
  [PageSlug.BLOG, cmsPagesPublicApi.getBlogPage],
  [PageSlug.CONTACT, cmsPagesPublicApi.getContactPage],
  [PageSlug.FAQ, cmsPagesPublicApi.getFaqPage],
];
