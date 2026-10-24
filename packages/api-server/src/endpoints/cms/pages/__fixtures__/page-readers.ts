import { type LocaleCode } from "@repo/contracts/cms/locale";
import { PageSlug, type PublicPageSlug } from "@repo/contracts/cms/pages";

import { cmsPagesPublicApi } from "../public";

export type PageReader = (locale: LocaleCode) => Promise<{ hero: unknown; seo: unknown }>;

export const PAGE_READERS: readonly (readonly [PublicPageSlug, PageReader])[] = [
  [PageSlug.HOME, cmsPagesPublicApi.getHomePage],
  [PageSlug.STOREFRONT, cmsPagesPublicApi.getStorefrontProgramsPage],
  [PageSlug.ABOUT, cmsPagesPublicApi.getAboutPage],
  [PageSlug.BLOG, cmsPagesPublicApi.getBlogPage],
  [PageSlug.CONTACT, cmsPagesPublicApi.getContactPage],
  [PageSlug.FAQ, cmsPagesPublicApi.getFaqPage],
  [PageSlug.OFFER, cmsPagesPublicApi.getOfferPage],
];
