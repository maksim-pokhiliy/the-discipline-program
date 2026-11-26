import { type LocaleCode } from "@repo/contracts/cms/locale";
import { type PageSlug } from "@repo/contracts/cms/pages";

import { withLocaleParam } from "@app/lib/config/locale-url";

export const pagesListHref = (code: LocaleCode): string => {
  const query = withLocaleParam(new URLSearchParams(), code).toString();

  return query ? `/pages?${query}` : "/pages";
};

export const pageEditHref = (slug: PageSlug, code: LocaleCode): string => {
  const query = withLocaleParam(new URLSearchParams(), code).toString();

  return query ? `/pages/${slug}?${query}` : `/pages/${slug}`;
};
