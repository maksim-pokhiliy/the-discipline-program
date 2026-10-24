import { describe, expect, it } from "vitest";

import {
  isPublicPageSlug,
  PAGE_SECTIONS_MAP,
  PAGE_SLUG_PATH_MAP,
  PageSlug,
  type PublicPageSlug,
} from "./pages.constants";

const PUBLIC_PAGE_SLUGS: readonly PublicPageSlug[] =
  Object.values(PageSlug).filter(isPublicPageSlug);

describe("isPublicPageSlug", () => {
  it("refuses the site pseudo-page", () => {
    expect(isPublicPageSlug(PageSlug.SITE)).toBe(false);
  });

  it("accepts every other page, the offer page included", () => {
    expect(PUBLIC_PAGE_SLUGS).toEqual(
      Object.values(PageSlug).filter((slug) => slug !== PageSlug.SITE),
    );
    expect(PUBLIC_PAGE_SLUGS).toContain(PageSlug.OFFER);
  });
});

describe("PAGE_SLUG_PATH_MAP", () => {
  it("maps every public page and gives the site pseudo-page no path", () => {
    expect(Object.keys(PAGE_SLUG_PATH_MAP).sort()).toEqual([...PUBLIC_PAGE_SLUGS].sort());
  });
});

describe("PAGE_SECTIONS_MAP", () => {
  it.each(PUBLIC_PAGE_SLUGS)("ends the %s page with its seo section", (slug) => {
    expect(Object.values(PAGE_SECTIONS_MAP[slug]).at(-1)).toBe(PAGE_SECTIONS_MAP[slug].seo);
  });

  it("gives the site pseudo-page its four chrome sections and no seo section", () => {
    expect(Object.keys(PAGE_SECTIONS_MAP[PageSlug.SITE])).toEqual([
      "navigation",
      "footer",
      "leadForm",
      "errors",
    ]);
  });
});
