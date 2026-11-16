import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "../locale";

import {
  adminPageDetailsSchema,
  adminPageListItemSchema,
  adminPageSectionSchema,
  pageSlugRouteParamsSchema,
  revalidateQuerySchema,
  SECTION_SCHEMAS,
  SectionTranslationState,
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

const ADMIN_UPDATED_AT = "2026-11-02T09:00:00.000Z";
const ADMIN_HERO_ROW = {
  id: "cfixtureadminherorow",
  section: PAGE_SECTIONS_MAP.home.hero,
  data: { title: "Fixture title" },
  updatedAt: ADMIN_UPDATED_AT,
  hasUnreadableData: false,
  translation: null,
};
const ADMIN_ENGLISH_HERO = { data: ADMIN_HERO_ROW.data, updatedAt: ADMIN_UPDATED_AT };
const TRANSLATION_STATES = ["NOT_TRANSLATED", "DRAFT", "TRANSLATED", "ENGLISH_NEWER"];

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

  it("builds every write variant with the top-level fields of its own section", () => {
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

describe("adminPageSectionSchema", () => {
  it("has one admin variant per section", () => {
    const variantSections = adminPageSectionSchema.options.map(
      (variant) => variant.shape.section.value,
    );

    expect([...variantSections].sort()).toEqual([...CATALOG_SECTIONS].sort());
  });

  it("builds every admin variant with the top-level fields of its own section", () => {
    const mismatched = adminPageSectionSchema.options.filter((variant) => {
      const expectedFields = Object.keys(SECTION_SCHEMAS[variant.shape.section.value].shape);
      const englishData = variant.shape.translation.unwrap().shape.english.shape.data;

      return (
        Object.keys(variant.shape.data.shape).join() !== expectedFields.join() ||
        Object.keys(englishData.shape).join() !== expectedFields.join()
      );
    });

    expect(mismatched.map((variant) => variant.shape.section.value)).toEqual([]);
  });

  it("strips a field of another section from a row's data and its English reference", () => {
    const data = { ...ADMIN_HERO_ROW.data, readMoreLabel: "Foreign fixture field" };
    const row = adminPageSectionSchema.parse({
      ...ADMIN_HERO_ROW,
      data,
      translation: {
        state: SectionTranslationState.TRANSLATED,
        english: { ...ADMIN_ENGLISH_HERO, data },
      },
    });

    expect(row.data).toEqual(ADMIN_HERO_ROW.data);
    expect(row.translation?.english.data).toEqual(ADMIN_HERO_ROW.data);
  });

  it("carries the row and English dates as ISO strings", () => {
    const translation = {
      state: SectionTranslationState.TRANSLATED,
      english: ADMIN_ENGLISH_HERO,
    };
    const row = { ...ADMIN_HERO_ROW, translation };

    expect(adminPageSectionSchema.parse(row)).toEqual(row);
    expect(
      adminPageSectionSchema.safeParse({ ...row, updatedAt: new Date(ADMIN_UPDATED_AT) }).success,
    ).toBe(false);
    expect(
      adminPageSectionSchema.safeParse({
        ...row,
        translation: {
          ...translation,
          english: { ...ADMIN_ENGLISH_HERO, updatedAt: new Date(ADMIN_UPDATED_AT) },
        },
      }).success,
    ).toBe(false);
  });

  it("accepts only the four translation states", () => {
    expect(Object.values(SectionTranslationState)).toEqual(TRANSLATION_STATES);

    for (const state of [...TRANSLATION_STATES, "UNKNOWN"]) {
      const result = adminPageSectionSchema.safeParse({
        ...ADMIN_HERO_ROW,
        translation: { state, english: ADMIN_ENGLISH_HERO },
      });

      expect(result.success).toBe(TRANSLATION_STATES.includes(state));
    }
  });

  it("accepts an English row without a translation", () => {
    expect(adminPageSectionSchema.parse(ADMIN_HERO_ROW)).toEqual(ADMIN_HERO_ROW);
  });
});

describe("adminPageListItemSchema", () => {
  it("carries a translated count or null", () => {
    const page = {
      id: "cfixtureadminpage",
      slug: PageSlug.HOME,
      title: "Fixture page",
      updatedAt: new Date(ADMIN_UPDATED_AT),
    };

    for (const translatedSectionCount of [null, 0, 1]) {
      const row = { ...page, translatedSectionCount };

      expect(adminPageListItemSchema.parse(row)).toEqual(row);
    }

    expect(adminPageListItemSchema.safeParse(page).success).toBe(false);
    expect(adminPageListItemSchema.safeParse({ ...page, translatedSectionCount: -1 }).success).toBe(
      false,
    );
    expect(
      adminPageListItemSchema.safeParse({ ...page, translatedSectionCount: 1.5 }).success,
    ).toBe(false);
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
