import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminPageDetails,
  PAGE_SECTIONS_MAP,
  PageSlug,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import {
  FRENCH,
  GERMAN,
  seedLocaleCatalog,
  UKRAINIAN,
  UNKNOWN_LOCALE_CODE,
} from "../locale/__fixtures__/locale-catalog";
import { openTransaction, refusalOf, waitForLockWaiter } from "../locale/__fixtures__/lock-race";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  DEFAULT_LOCALE_ROW,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA, GERMAN_ABOUT_HERO, UK_ABOUT_HERO } from "./__fixtures__/section-data";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { cmsPagesAdminApi } from "./admin";

const ABOUT_SECTIONS = Object.values(PAGE_SECTIONS_MAP.about);
const ABOUT_HERO = PAGE_SECTIONS_MAP.about.hero;
const ABOUT_HERO_ROW = { pageSlug: PageSlug.ABOUT, section: ABOUT_HERO };
const ABOUT_JOURNEY_ROW = { pageSlug: PageSlug.ABOUT, section: PAGE_SECTIONS_MAP.about.journey };
const REVERSED_SECTION_ID_PREFIX = "reversed-uk-about-section-";
const REWRITTEN_UK_ABOUT_HERO = { title: "Про мене, друга редакція" };
const REWRITTEN_ENGLISH_ABOUT_HERO = { title: "About, second edit" };
const UK_PARTIAL_JOURNEY = { title: "Мій шлях", timeline: [{ year: "2019" }] };
const LOCALE_NOT_FOUND = { name: NotFoundError.name, message: "Locale not found" };
const LOCALE_WRITES: readonly (readonly [string, (locale: LocaleCode) => Promise<unknown>])[] = [
  ["getPageBySlug scaffolds", (locale) => cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, locale)],
  [
    "updateSection writes",
    (locale) => cmsPagesAdminApi.updateSection({ ...ABOUT_HERO_ROW, data: UK_ABOUT_HERO, locale }),
  ],
];

const readRows = (locale: LocaleCode) =>
  cleanupRaw.marketingPageSection.findMany({ where: { locale }, orderBy: { id: "asc" } });

const readAboutRowIds = async (locale: LocaleCode): Promise<string[]> => {
  const rows = await cleanupRaw.marketingPageSection.findMany({
    where: { pageSlug: PageSlug.ABOUT, locale },
    select: { id: true },
  });

  return rows.map((row) => row.id).sort();
};

const readAboutHero = (locale: LocaleCode) =>
  cleanupRaw.marketingPageSection.findUnique({
    where: { pageSlug_section_locale: { ...ABOUT_HERO_ROW, locale } },
  });

const sectionIds = (details: AdminPageDetails): string[] =>
  details.sections.map((section) => section.id).sort();

const sectionData = (details: AdminPageDetails, key: SectionSchemaKey): unknown =>
  details.sections.find((section) => section.section === key)?.data;

describe("cmsPagesAdminApi — locales", () => {
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

  describe("getPageBySlug", () => {
    it("scaffolds the uk rows with empty data and leaves the English rows alone", async () => {
      const englishRows = await readRows(DEFAULT_LOCALE_CODE);

      await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, UKRAINIAN.code);

      const ukRows = await readRows(UKRAINIAN.code);

      expect(ukRows).toHaveLength(ABOUT_SECTIONS.length);
      expect(ukRows.map(({ pageSlug, section, data }) => ({ pageSlug, section, data }))).toEqual(
        expect.arrayContaining(
          ABOUT_SECTIONS.map((section) => ({ pageSlug: PageSlug.ABOUT, section, data: {} })),
        ),
      );
      expect(await readRows(DEFAULT_LOCALE_CODE)).toEqual(englishRows);
    });

    it("returns the requested locale and only its sections", async () => {
      await seedSectionsWithOverrides({ [ABOUT_HERO]: UK_ABOUT_HERO }, UKRAINIAN.code);

      const details = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, UKRAINIAN.code);

      expect(details.locale).toBe(UKRAINIAN.code);
      expect(sectionIds(details)).toEqual(await readAboutRowIds(UKRAINIAN.code));
      expect(sectionData(details, ABOUT_HERO)).toEqual(UK_ABOUT_HERO);
    });

    it("returns the uk sections in the canonical order whatever order the rows were stored in", async () => {
      await cleanupRaw.marketingPageSection.createMany({
        data: [...ABOUT_SECTIONS].reverse().map((section, index) => ({
          id: `${REVERSED_SECTION_ID_PREFIX}${index}`,
          pageSlug: PageSlug.ABOUT,
          section,
          locale: UKRAINIAN.code,
          data: {},
        })),
      });

      const details = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, UKRAINIAN.code);

      expect(details.sections.map((section) => section.section)).toEqual(ABOUT_SECTIONS);
      expect(sectionIds(details)).toEqual(await readAboutRowIds(UKRAINIAN.code));
    });

    it("takes a disabled locale", async () => {
      const details = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, GERMAN.code);

      expect(GERMAN.isEnabled).toBe(false);
      expect(details.locale).toBe(GERMAN.code);
      expect(details.sections.map((section) => section.section)).toEqual(ABOUT_SECTIONS);
      expect(sectionIds(details)).toEqual(await readAboutRowIds(GERMAN.code));
    });

    it("refuses an unknown locale with NotFoundError and writes nothing", async () => {
      await cleanupRaw.marketingPage.delete({ where: { slug: PageSlug.ABOUT } });

      const before = await captureMarketingPagesState();

      await expect(
        cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, UNKNOWN_LOCALE_CODE),
      ).rejects.toThrow(NotFoundError);

      expect(await captureMarketingPagesState()).toEqual(before);
    });

    it("recreates the default locale on a table without it", async () => {
      await clearMarketingPagesState();
      await cleanupRaw.marketingLocale.deleteMany();

      const details = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT);

      expect(details.locale).toBe(DEFAULT_LOCALE_CODE);
      expect(details.sections.map((section) => section.section)).toEqual(ABOUT_SECTIONS);
      expect(
        await cleanupRaw.marketingLocale.findMany({
          select: { code: true, name: true, isEnabled: true, sortOrder: true },
        }),
      ).toEqual([DEFAULT_LOCALE_ROW]);
    });

    it("answers the English page when the locale is omitted", async () => {
      await seedSectionsWithOverrides({ [ABOUT_HERO]: UK_ABOUT_HERO }, UKRAINIAN.code);

      const details = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT);

      expect(details.locale).toBe(DEFAULT_LOCALE_CODE);
      expect(sectionIds(details)).toEqual(await readAboutRowIds(DEFAULT_LOCALE_CODE));
      expect(sectionData(details, ABOUT_HERO)).toEqual(FULL_SECTION_DATA[ABOUT_HERO]);
    });

    it("returns a nested partial item that updateSection stored", async () => {
      await cmsPagesAdminApi.updateSection({
        ...ABOUT_JOURNEY_ROW,
        data: UK_PARTIAL_JOURNEY,
        locale: UKRAINIAN.code,
      });

      const details = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, UKRAINIAN.code);

      expect(sectionData(details, ABOUT_JOURNEY_ROW.section)).toEqual(UK_PARTIAL_JOURNEY);
    });
  });

  describe("updateSection", () => {
    it("writes the uk row and leaves the English row alone", async () => {
      const englishHero = await readAboutHero(DEFAULT_LOCALE_CODE);

      await cmsPagesAdminApi.updateSection({
        ...ABOUT_HERO_ROW,
        data: UK_ABOUT_HERO,
        locale: UKRAINIAN.code,
      });

      expect(await readAboutHero(UKRAINIAN.code)).toMatchObject({ data: UK_ABOUT_HERO });
      expect(await readAboutHero(DEFAULT_LOCALE_CODE)).toEqual(englishHero);
    });

    it("updates the existing uk row instead of adding a second one", async () => {
      await cmsPagesAdminApi.updateSection({
        ...ABOUT_HERO_ROW,
        data: UK_ABOUT_HERO,
        locale: UKRAINIAN.code,
      });

      const firstWrite = await readAboutHero(UKRAINIAN.code);

      await cmsPagesAdminApi.updateSection({
        ...ABOUT_HERO_ROW,
        data: REWRITTEN_UK_ABOUT_HERO,
        locale: UKRAINIAN.code,
      });

      expect(firstWrite).not.toBeNull();
      expect(await readAboutHero(UKRAINIAN.code)).toMatchObject({
        id: firstWrite?.id,
        data: REWRITTEN_UK_ABOUT_HERO,
      });
      expect(
        await cleanupRaw.marketingPageSection.count({
          where: { ...ABOUT_HERO_ROW, locale: UKRAINIAN.code },
        }),
      ).toBe(1);
    });

    it("writes the English row when the payload carries no locale", async () => {
      await cmsPagesAdminApi.updateSection({
        ...ABOUT_HERO_ROW,
        data: REWRITTEN_ENGLISH_ABOUT_HERO,
      });

      expect(await readAboutHero(DEFAULT_LOCALE_CODE)).toMatchObject({
        data: REWRITTEN_ENGLISH_ABOUT_HERO,
      });
      expect(
        await cleanupRaw.marketingPageSection.count({
          where: { locale: { not: DEFAULT_LOCALE_CODE } },
        }),
      ).toBe(0);
    });

    it("writes a disabled locale's row", async () => {
      await cmsPagesAdminApi.updateSection({
        ...ABOUT_HERO_ROW,
        data: GERMAN_ABOUT_HERO,
        locale: GERMAN.code,
      });

      expect(GERMAN.isEnabled).toBe(false);
      expect(await readAboutHero(GERMAN.code)).toMatchObject({ data: GERMAN_ABOUT_HERO });
    });

    it("refuses an unknown locale with NotFoundError and writes nothing", async () => {
      await cleanupRaw.marketingPage.delete({ where: { slug: PageSlug.ABOUT } });

      const before = await captureMarketingPagesState();

      await expect(
        cmsPagesAdminApi.updateSection({
          ...ABOUT_HERO_ROW,
          data: UK_ABOUT_HERO,
          locale: UNKNOWN_LOCALE_CODE,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(await captureMarketingPagesState()).toEqual(before);
    });
  });

  it.each(LOCALE_WRITES)(
    "answers the unknown-locale NotFoundError when %s the rows of a locale deleted meanwhile",
    async (_label, write) => {
      const unknownRefusal = await refusalOf(write(UNKNOWN_LOCALE_CODE));
      const deletion = await openTransaction((tx) =>
        tx.marketingLocale.delete({ where: { code: FRENCH.code } }),
      );
      const raceRefusal = refusalOf(write(FRENCH.code));

      try {
        await waitForLockWaiter("marketing_page_sections");
      } finally {
        await deletion.commit();
      }

      expect(unknownRefusal).toMatchObject(LOCALE_NOT_FOUND);
      expect(await raceRefusal).toEqual(unknownRefusal);
      expect(await readRows(FRENCH.code)).toEqual([]);
    },
  );
});
