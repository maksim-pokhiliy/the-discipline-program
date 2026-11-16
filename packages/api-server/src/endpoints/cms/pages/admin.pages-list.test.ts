import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PAGE_SECTIONS_MAP, PageSlug, SectionTranslationState } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import {
  GERMAN,
  seedLocaleCatalog,
  UKRAINIAN,
  UNKNOWN_LOCALE_CODE,
} from "../locale/__fixtures__/locale-catalog";
import { cmsLocaleAdminApi } from "../locale/admin";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA, UNPARSABLE_SECTION_DATA } from "./__fixtures__/section-data";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import {
  NEWER_ENGLISH_UPDATED_AT,
  seedTranslationRow,
  UK_HERO,
} from "./__fixtures__/translation-rows";
import { cmsPagesAdminApi } from "./admin";

const ABOUT = PAGE_SECTIONS_MAP.about;
const ABOUT_TRANSLATED_COUNT = 2;

const seedServedRows = async (): Promise<void> => {
  await seedTranslationRow(PageSlug.ABOUT, ABOUT.hero, UK_HERO, UKRAINIAN.code);
  await seedTranslationRow(
    PageSlug.ABOUT,
    ABOUT.cta,
    { title: "Translated call to action" },
    UKRAINIAN.code,
  );
  await seedTranslationRow(
    PageSlug.HOME,
    PAGE_SECTIONS_MAP.home.reviews,
    { title: "Translated reviews" },
    UKRAINIAN.code,
  );
  await cleanupRaw.marketingPageSection.update({
    where: {
      pageSlug_section_locale: { pageSlug: PageSlug.ABOUT, section: ABOUT.hero, locale: "en" },
    },
    data: { updatedAt: NEWER_ENGLISH_UPDATED_AT },
  });
};

describe("cmsPagesAdminApi.getPages — translated count per page", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
    await seedSectionsWithOverrides(FULL_SECTION_DATA);
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("counts the translated and English-newer sections of each page in a locale", async () => {
    await seedServedRows();

    const pages = await cmsPagesAdminApi.getPages(UKRAINIAN.code);
    const about = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, UKRAINIAN.code);

    expect(about.sections.find(({ section }) => section === ABOUT.hero)?.translation?.state).toBe(
      SectionTranslationState.ENGLISH_NEWER,
    );
    expect(
      pages.map(({ slug, translatedSectionCount }) => ({ slug, translatedSectionCount })),
    ).toEqual(
      Object.values(PageSlug)
        .sort()
        .map((slug) => ({
          slug,
          translatedSectionCount:
            slug === PageSlug.ABOUT ? ABOUT_TRANSLATED_COUNT : slug === PageSlug.HOME ? 1 : 0,
        })),
    );
  });

  it("does not count drafts, empty, unparsable, unknown-key or foreign rows", async () => {
    await seedTranslationRow(PageSlug.ABOUT, ABOUT.hero, UK_HERO, UKRAINIAN.code, false);
    await seedTranslationRow(PageSlug.ABOUT, ABOUT.journey, {}, UKRAINIAN.code);
    await seedTranslationRow(
      PageSlug.ABOUT,
      ABOUT.personal,
      UNPARSABLE_SECTION_DATA,
      UKRAINIAN.code,
    );
    await seedTranslationRow(
      PageSlug.ABOUT,
      ABOUT.credentials,
      { retiredTitle: "Retired" },
      UKRAINIAN.code,
    );
    await seedTranslationRow(
      PageSlug.ABOUT,
      PAGE_SECTIONS_MAP.contact.hero,
      UK_HERO,
      UKRAINIAN.code,
    );

    const pages = await cmsPagesAdminApi.getPages(UKRAINIAN.code);

    expect(pages.every(({ translatedSectionCount }) => translatedSectionCount === 0)).toBe(true);
  });

  it("sums the per-page counts to the Languages count", async () => {
    await seedServedRows();

    const pages = await cmsPagesAdminApi.getPages(UKRAINIAN.code);
    const locales = await cmsLocaleAdminApi.getLocales();
    const total = pages.reduce((sum, page) => sum + (page.translatedSectionCount ?? 0), 0);

    expect(total).toBeGreaterThan(0);
    expect(total).toBe(locales.find(({ code }) => code === UKRAINIAN.code)?.translatedSectionCount);
  });

  it("returns no count for English", async () => {
    const pages = await cmsPagesAdminApi.getPages();

    expect(pages.every(({ translatedSectionCount }) => translatedSectionCount === null)).toBe(true);
  });

  it("counts a disabled locale independently", async () => {
    await seedTranslationRow(PageSlug.ABOUT, ABOUT.hero, UK_HERO, GERMAN.code);

    const germanPages = await cmsPagesAdminApi.getPages(GERMAN.code);
    const ukrainianPages = await cmsPagesAdminApi.getPages(UKRAINIAN.code);

    expect(germanPages.find(({ slug }) => slug === PageSlug.ABOUT)?.translatedSectionCount).toBe(1);
    expect(ukrainianPages.every(({ translatedSectionCount }) => translatedSectionCount === 0)).toBe(
      true,
    );
  });

  it("does not scaffold any sections when listing a locale's pages", async () => {
    const before = await cleanupRaw.marketingPageSection.count();

    await cmsPagesAdminApi.getPages(UKRAINIAN.code);

    expect(await cleanupRaw.marketingPageSection.count()).toBe(before);
    expect(await cleanupRaw.marketingPageSection.count({ where: { locale: UKRAINIAN.code } })).toBe(
      0,
    );
  });

  it("refuses an unknown locale with NotFoundError and writes nothing", async () => {
    await cleanupRaw.marketingPage.delete({ where: { slug: PageSlug.ABOUT } });

    const before = await captureMarketingPagesState();

    await expect(cmsPagesAdminApi.getPages(UNKNOWN_LOCALE_CODE)).rejects.toThrow(NotFoundError);
    expect(await captureMarketingPagesState()).toEqual(before);
  });
});
