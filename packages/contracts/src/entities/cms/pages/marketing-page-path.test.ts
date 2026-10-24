import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "../locale";

import { marketingPagePath, marketingRevalidationTarget } from "./marketing-page-path";
import { isPublicPageSlug, PAGE_SLUG_PATH_MAP, PageSlug } from "./pages.constants";

const UKRAINIAN_CODE = "uk";

const PUBLIC_PAGE_SLUGS = Object.values(PageSlug).filter(isPublicPageSlug);

const SITE_LAYOUT_TARGET = { path: "/", type: "layout" };

describe("marketingPagePath", () => {
  it("keeps the unprefixed root for the home page in the default locale", () => {
    expect(marketingPagePath(PageSlug.HOME, DEFAULT_LOCALE_CODE)).toBe("/");
  });

  it("keeps the unprefixed path for a nested page in the default locale", () => {
    expect(marketingPagePath(PageSlug.ABOUT, DEFAULT_LOCALE_CODE)).toBe("/about");
  });

  it("gives the home page the bare locale prefix in another locale", () => {
    expect(marketingPagePath(PageSlug.HOME, UKRAINIAN_CODE)).toBe("/uk");
  });

  it("prefixes a nested page with the locale code in another locale", () => {
    expect(marketingPagePath(PageSlug.ABOUT, UKRAINIAN_CODE)).toBe("/uk/about");
  });

  it("serves the offer page unprefixed in the default locale and prefixed in another", () => {
    expect(marketingPagePath(PageSlug.OFFER, DEFAULT_LOCALE_CODE)).toBe("/offer");
    expect(marketingPagePath(PageSlug.OFFER, UKRAINIAN_CODE)).toBe("/uk/offer");
  });

  it.each(PUBLIC_PAGE_SLUGS)("matches PAGE_SLUG_PATH_MAP for %s in the default locale", (slug) => {
    expect(marketingPagePath(slug, DEFAULT_LOCALE_CODE)).toBe(PAGE_SLUG_PATH_MAP[slug]);
  });
});

describe("marketingRevalidationTarget", () => {
  it.each(PUBLIC_PAGE_SLUGS)("targets the path of the %s page alone, with no type", (slug) => {
    expect(marketingRevalidationTarget(slug, UKRAINIAN_CODE)).toStrictEqual({
      path: marketingPagePath(slug, UKRAINIAN_CODE),
    });
  });

  it.each([DEFAULT_LOCALE_CODE, UKRAINIAN_CODE])(
    "targets the root layout for the site pseudo-page in the %s locale",
    (locale) => {
      expect(marketingRevalidationTarget(PageSlug.SITE, locale)).toStrictEqual(SITE_LAYOUT_TARGET);
    },
  );
});
