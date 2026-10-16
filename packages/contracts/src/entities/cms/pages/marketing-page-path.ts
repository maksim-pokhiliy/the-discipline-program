import { DEFAULT_LOCALE_CODE, type LocaleCode } from "../locale";

import { PAGE_SLUG_PATH_MAP, type PageSlug } from "./pages.constants";

const ROOT_PATH = "/";

export const marketingPagePath = (slug: PageSlug, locale: LocaleCode): string => {
  const path = PAGE_SLUG_PATH_MAP[slug];

  if (locale === DEFAULT_LOCALE_CODE) {
    return path;
  }

  const prefix = `/${locale}`;

  return path === ROOT_PATH ? prefix : `${prefix}${path}`;
};
