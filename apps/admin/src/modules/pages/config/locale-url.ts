import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import { type PageSlug } from "@repo/contracts/cms/pages";

export const LOCALE_PARAM = "locale";

export const withLocaleParam = (params: URLSearchParams, code: LocaleCode): URLSearchParams => {
  const next = new URLSearchParams(params);

  if (code === DEFAULT_LOCALE_CODE) {
    next.delete(LOCALE_PARAM);
  } else {
    next.set(LOCALE_PARAM, code);
  }

  return next;
};

export const pagesListHref = (code: LocaleCode): string => {
  const query = withLocaleParam(new URLSearchParams(), code).toString();

  return query ? `/pages?${query}` : "/pages";
};

export const pageEditHref = (slug: PageSlug, code: LocaleCode): string => {
  const query = withLocaleParam(new URLSearchParams(), code).toString();

  return query ? `/pages/${slug}?${query}` : `/pages/${slug}`;
};
