import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "../locale";

import {
  adminPageDetailsSchema,
  pageSlugRouteParamsSchema,
  SECTION_SCHEMAS,
  updatePageSectionBodySchema,
} from "./pages-api.schema";
import { PAGE_SECTIONS_MAP, PageSlug } from "./pages.constants";

const UKRAINIAN_CODE = "uk";

const MALFORMED_LOCALE = "uk-UA";

const HOME_HERO_BODY = { section: PAGE_SECTIONS_MAP.home.hero, data: {} };

describe("pageSlugRouteParamsSchema", () => {
  it.each(Object.values(PageSlug))("accepts known page slug: %s", (slug) => {
    const result = pageSlugRouteParamsSchema.safeParse({ slug });

    expect(result.success).toBe(true);
  });

  it("rejects unknown slug string", () => {
    const result = pageSlugRouteParamsSchema.safeParse({ slug: "pricing" });

    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = pageSlugRouteParamsSchema.safeParse({ slug: "" });

    expect(result.success).toBe(false);
  });

  it("rejects missing slug field", () => {
    const result = pageSlugRouteParamsSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects numeric slug", () => {
    const result = pageSlugRouteParamsSchema.safeParse({ slug: 123 });

    expect(result.success).toBe(false);
  });
});

describe("updatePageSectionBodySchema locale", () => {
  it("fills the default locale when the body omits it", () => {
    expect(updatePageSectionBodySchema.parse(HOME_HERO_BODY)).toEqual({
      ...HOME_HERO_BODY,
      locale: DEFAULT_LOCALE_CODE,
    });
  });

  it("keeps an explicit locale", () => {
    expect(
      updatePageSectionBodySchema.parse({ ...HOME_HERO_BODY, locale: UKRAINIAN_CODE }),
    ).toEqual({ ...HOME_HERO_BODY, locale: UKRAINIAN_CODE });
  });

  it("refuses a malformed locale", () => {
    const result = updatePageSectionBodySchema.safeParse({
      ...HOME_HERO_BODY,
      locale: MALFORMED_LOCALE,
    });

    expect(result.success).toBe(false);
  });

  it.each(Object.keys(SECTION_SCHEMAS))("carries the locale on the %s variant", (section) => {
    const omitted = updatePageSectionBodySchema.parse({ section, data: {} });
    const malformed = updatePageSectionBodySchema.safeParse({
      section,
      data: {},
      locale: MALFORMED_LOCALE,
    });

    expect(omitted.locale).toBe(DEFAULT_LOCALE_CODE);
    expect(malformed.success).toBe(false);
  });
});

describe("adminPageDetailsSchema locale", () => {
  it("refuses details without a locale", () => {
    const details = { slug: PageSlug.HOME, sections: [] };

    expect(adminPageDetailsSchema.safeParse(details).success).toBe(false);
    expect(
      adminPageDetailsSchema.safeParse({ ...details, locale: DEFAULT_LOCALE_CODE }).success,
    ).toBe(true);
  });
});
