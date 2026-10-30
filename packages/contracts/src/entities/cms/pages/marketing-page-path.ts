import { DEFAULT_LOCALE_CODE, type LocaleCode } from "../locale";

import { type MarketingRevalidationTarget } from "./pages-api.types";
import {
  isPublicPageSlug,
  PAGE_SLUG_PATH_MAP,
  type PageSlug,
  type PublicPageSlug,
} from "./pages.constants";

const ROOT_PATH = "/";

const SITE_REVALIDATION_TARGET: MarketingRevalidationTarget = { path: ROOT_PATH, type: "layout" };

export const marketingPagePath = (slug: PublicPageSlug, locale: LocaleCode): string => {
  const path = PAGE_SLUG_PATH_MAP[slug];

  if (locale === DEFAULT_LOCALE_CODE) {
    return path;
  }

  const prefix = `/${locale}`;

  return path === ROOT_PATH ? prefix : `${prefix}${path}`;
};

export const marketingRevalidationTarget = (
  slug: PageSlug,
  locale: LocaleCode,
): MarketingRevalidationTarget =>
  isPublicPageSlug(slug) ? { path: marketingPagePath(slug, locale) } : SITE_REVALIDATION_TARGET;
