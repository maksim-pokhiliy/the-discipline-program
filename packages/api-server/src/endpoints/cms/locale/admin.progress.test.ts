import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug, SECTION_SCHEMAS } from "@repo/contracts/cms/pages";

import { defaultMonitoring } from "../../../infrastructure/monitoring";
import { cleanupRaw } from "../../../test/helpers";
import { insertSectionRows } from "../pages/__fixtures__/localized-section-rows";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";
import {
  FULL_SECTION_DATA,
  GERMAN_ABOUT_HERO,
  UK_ABOUT_HERO,
  UNPARSABLE_SECTION_DATA,
} from "../pages/__fixtures__/section-data";
import { sectionFallbackCases } from "../pages/__fixtures__/section-fallback";
import { seedSectionsWithOverrides } from "../pages/__fixtures__/seed-with-overrides";
import { cmsPagesPublicApi } from "../pages/public";

import { GERMAN, seedLocaleCatalog, UKRAINIAN } from "./__fixtures__/locale-catalog";
import { UNSERVED_SECTION_RELATIONS } from "./__fixtures__/translation-progress";
import { cmsLocaleAdminApi } from "./admin";

const ABOUT = PAGE_SECTIONS_MAP.about;
const ENGLISH_ABOUT_HERO = FULL_SECTION_DATA[ABOUT.hero];
const FALLBACK_CASES = sectionFallbackCases(ABOUT.hero, UK_ABOUT_HERO, UNPARSABLE_SECTION_DATA);
const UKRAINIAN_SECTION_COUNT = 2;

const readTranslatedSectionCount = async (code: string) => {
  const locales = await cmsLocaleAdminApi.getLocales();

  return locales.find((locale) => locale.code === code)?.translatedSectionCount;
};

describe("cmsLocaleAdminApi.getLocales — translatedSectionCount", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
    await seedSectionsWithOverrides(FULL_SECTION_DATA);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("returns zero for a locale without section rows", async () => {
    expect(await readTranslatedSectionCount(UKRAINIAN.code)).toBe(0);
  });

  it.each(FALLBACK_CASES)(
    "does not count a Ukrainian about hero that is %s, and the reader falls back to English for it",
    async (_label, rows) => {
      await insertSectionRows(PageSlug.ABOUT, UKRAINIAN.code, rows);

      expect(await readTranslatedSectionCount(UKRAINIAN.code)).toBe(0);
      expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).hero).toEqual(
        ENGLISH_ABOUT_HERO,
      );
    },
  );

  it("counts a served row and the reader serves it", async () => {
    await insertSectionRows(PageSlug.ABOUT, UKRAINIAN.code, [
      { section: ABOUT.hero, data: UK_ABOUT_HERO, isActive: true },
    ]);

    expect(await readTranslatedSectionCount(UKRAINIAN.code)).toBe(1);
    expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).hero).toEqual(UK_ABOUT_HERO);
  });

  it("does not count a row of unknown keys only and the reader falls back to English", async () => {
    await insertSectionRows(PageSlug.ABOUT, UKRAINIAN.code, [
      { section: ABOUT.hero, data: { retiredTitle: "Old title" }, isActive: true },
    ]);

    expect(await readTranslatedSectionCount(UKRAINIAN.code)).toBe(0);
    expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).hero).toEqual(ENGLISH_ABOUT_HERO);
  });

  it.each(UNSERVED_SECTION_RELATIONS)("does not count $name", async ({ pageSlug, section }) => {
    await cleanupRaw.marketingPage.createMany({
      data: [{ slug: pageSlug, title: "Synthetic page" }],
      skipDuplicates: true,
    });
    await cleanupRaw.marketingPageSection.create({
      data: { pageSlug, section, locale: UKRAINIAN.code, data: UK_ABOUT_HERO, isActive: true },
    });

    expect(await readTranslatedSectionCount(UKRAINIAN.code)).toBe(0);
    expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).hero).toEqual(ENGLISH_ABOUT_HERO);
  });

  it("counts a nested partial item that the reader serves", async () => {
    const data = { timeline: [{ year: "2026" }] };

    await insertSectionRows(PageSlug.ABOUT, UKRAINIAN.code, [
      { section: ABOUT.journey, data, isActive: true },
    ]);

    expect(await readTranslatedSectionCount(UKRAINIAN.code)).toBe(1);
    expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).journey).toEqual(data);
  });

  it("counts each locale on its own, including a disabled locale", async () => {
    await insertSectionRows(PageSlug.ABOUT, UKRAINIAN.code, [
      { section: ABOUT.hero, data: UK_ABOUT_HERO, isActive: true },
      { section: ABOUT.cta, data: { title: "Get in touch" }, isActive: true },
    ]);
    await insertSectionRows(PageSlug.ABOUT, GERMAN.code, [
      { section: ABOUT.hero, data: GERMAN_ABOUT_HERO, isActive: true },
    ]);

    const locales = await cmsLocaleAdminApi.getLocales();

    expect(locales.find(({ code }) => code === UKRAINIAN.code)).toMatchObject({
      translatedSectionCount: UKRAINIAN_SECTION_COUNT,
    });
    expect(locales.find(({ code }) => code === GERMAN.code)).toMatchObject({
      isEnabled: false,
      translatedSectionCount: 1,
    });
  });

  it("counts every English section after a full English seed", async () => {
    expect(await readTranslatedSectionCount(DEFAULT_LOCALE_CODE)).toBe(
      Object.keys(SECTION_SCHEMAS).length,
    );
  });

  it("never reports unparsable section rows to monitoring", async () => {
    await insertSectionRows(PageSlug.ABOUT, UKRAINIAN.code, [
      { section: ABOUT.hero, data: UNPARSABLE_SECTION_DATA, isActive: true },
    ]);

    const warnings = vi.spyOn(defaultMonitoring, "captureException");

    expect(await readTranslatedSectionCount(UKRAINIAN.code)).toBe(0);
    expect(warnings).not.toHaveBeenCalled();
  });
});
