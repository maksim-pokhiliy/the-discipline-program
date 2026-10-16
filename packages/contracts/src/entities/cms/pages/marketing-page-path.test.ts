import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "../locale";

import { marketingPagePath } from "./marketing-page-path";
import { PAGE_SLUG_PATH_MAP, PageSlug } from "./pages.constants";

const UKRAINIAN_CODE = "uk";

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

  it.each(Object.values(PageSlug))(
    "matches PAGE_SLUG_PATH_MAP for %s in the default locale",
    (slug) => {
      expect(marketingPagePath(slug, DEFAULT_LOCALE_CODE)).toBe(PAGE_SLUG_PATH_MAP[slug]);
    },
  );
});
