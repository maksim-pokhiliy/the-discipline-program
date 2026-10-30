import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "../locale";

import {
  adminPageDetailsSchema,
  pageSlugRouteParamsSchema,
  revalidateQuerySchema,
  SECTION_SCHEMAS,
  updatePageSectionBodySchema,
} from "./pages-api.schema";
import { PAGE_SECTIONS_MAP, PageSlug } from "./pages.constants";

const UKRAINIAN_CODE = "uk";

const MALFORMED_LOCALE = "uk-UA";

const HOME_HERO_BODY = { section: PAGE_SECTIONS_MAP.home.hero, data: {} };

const RESERVED_LOCALE = "faq";

const SITE_REVALIDATION = { path: "/", type: "layout" };

const PAGE_REVALIDATION = { path: "/uk/offer" };

const CATALOG_SECTIONS = Object.values(PAGE_SECTIONS_MAP).flatMap((sections) =>
  Object.values(sections),
);

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

describe("SECTION_SCHEMAS", () => {
  it("holds one schema for every section of the page map and nothing else", () => {
    expect(Object.keys(SECTION_SCHEMAS).sort()).toEqual([...CATALOG_SECTIONS].sort());
  });

  it("has one write variant per section", () => {
    const variantSections = updatePageSectionBodySchema.options.map(
      (variant) => variant.shape.section.value,
    );

    expect([...variantSections].sort()).toEqual([...CATALOG_SECTIONS].sort());
  });

  it("builds every write variant from the schema of its own section", () => {
    const mismatched = updatePageSectionBodySchema.options.filter(
      (variant) =>
        Object.keys(variant.shape.data.shape).join() !==
        Object.keys(SECTION_SCHEMAS[variant.shape.section.value].shape).join(),
    );

    expect(mismatched.map((variant) => variant.shape.section.value)).toEqual([]);
  });

  it("preserves the distinct nested fields of credential and FAQ write payloads", () => {
    const credentials = { items: [{ title: "Coach", description: "Qualified" }] };
    const content = { items: [{ question: "When?", answer: "Today" }] };

    expect(
      updatePageSectionBodySchema.parse({
        section: PAGE_SECTIONS_MAP.about.credentials,
        data: credentials,
      }).data,
    ).toEqual(credentials);
    expect(
      updatePageSectionBodySchema.parse({
        section: PAGE_SECTIONS_MAP.faq.content,
        data: content,
      }).data,
    ).toEqual(content);
  });
});

describe("updatePageSectionBodySchema for the new sections", () => {
  it("keeps the card action label of the storefront grid", () => {
    const body = updatePageSectionBodySchema.parse({
      section: PAGE_SECTIONS_MAP.storefront.grid,
      data: { cardActionLabel: "Open" },
    });

    expect(body.data).toEqual({ cardActionLabel: "Open" });
  });

  it("keeps a partial site navigation by its own fields", () => {
    const body = updatePageSectionBodySchema.parse({
      section: PAGE_SECTIONS_MAP.site.navigation,
      data: { offer: "Offer link", openMenuLabel: "Menu" },
    });

    expect(body.data).toEqual({ offer: "Offer link", openMenuLabel: "Menu" });
  });

  it("keeps the requisite rows and the terms blocks of the offer page", () => {
    const requisites = { title: "Seller", items: [{ label: "Tax id", value: "0000000000" }] };
    const terms = { blocks: [{ heading: "Refunds" }] };

    expect(
      updatePageSectionBodySchema.parse({
        section: PAGE_SECTIONS_MAP.offer.requisites,
        data: requisites,
      }).data,
    ).toEqual(requisites);
    expect(
      updatePageSectionBodySchema.parse({ section: PAGE_SECTIONS_MAP.offer.terms, data: terms })
        .data,
    ).toEqual(terms);
  });

  it("refuses a requisite row whose value is not text", () => {
    const result = updatePageSectionBodySchema.safeParse({
      section: PAGE_SECTIONS_MAP.offer.requisites,
      data: { items: [{ label: "Tax id", value: 42 }] },
    });

    expect(result.success).toBe(false);
  });

  it("refuses a reserved locale code", () => {
    const result = updatePageSectionBodySchema.safeParse({
      ...HOME_HERO_BODY,
      locale: RESERVED_LOCALE,
    });

    expect(result.success).toBe(false);
  });
});

describe("revalidateQuerySchema", () => {
  it("takes a page path without a type", () => {
    expect(revalidateQuerySchema.parse(PAGE_REVALIDATION)).toStrictEqual(PAGE_REVALIDATION);
  });

  it("takes the root path with the layout type", () => {
    expect(revalidateQuerySchema.parse(SITE_REVALIDATION)).toStrictEqual(SITE_REVALIDATION);
  });

  it("ignores the secret and any other parameter", () => {
    expect(
      revalidateQuerySchema.parse({ ...PAGE_REVALIDATION, secret: "s", extra: "x" }),
    ).toStrictEqual(PAGE_REVALIDATION);
  });

  it.each([{}, { path: "" }, { path: "about" }, { path: "https://example.com/about" }])(
    "refuses a query without a root-relative path: %j",
    (query) => {
      expect(revalidateQuerySchema.safeParse(query).success).toBe(false);
    },
  );

  it.each(["page", "LAYOUT", ""])("refuses the type %j", (type) => {
    expect(revalidateQuerySchema.safeParse({ path: "/", type }).success).toBe(false);
  });
});
