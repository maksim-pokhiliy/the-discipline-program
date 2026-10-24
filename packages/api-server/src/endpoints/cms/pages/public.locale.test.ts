import { type Prisma } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { cleanupRaw } from "../../../test/helpers";
import {
  GERMAN,
  SEEDED_LOCALES,
  seedLocaleCatalog,
  UKRAINIAN,
  UNKNOWN_LOCALE_CODE,
} from "../locale/__fixtures__/locale-catalog";
import { refusalOf } from "../locale/__fixtures__/lock-race";

import { fetchedLocales } from "./__fixtures__/fetched-locales";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { PAGE_READERS } from "./__fixtures__/page-readers";
import {
  FULL_SECTION_DATA,
  GERMAN_ABOUT_HERO,
  UK_ABOUT_HERO,
  UNPARSABLE_SECTION_DATA,
} from "./__fixtures__/section-data";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { updateEnglishSection } from "./__fixtures__/update-english-section";
import { cmsPagesPublicApi } from "./public";

type AboutRowSeed = {
  section: SectionSchemaKey;
  locale: LocaleCode;
  data: Prisma.InputJsonValue;
  isActive: boolean;
};

type UkHeroRow = Pick<AboutRowSeed, "data" | "isActive">;

const ABOUT = PAGE_SECTIONS_MAP.about;
const ENGLISH_ABOUT_HERO = FULL_SECTION_DATA[ABOUT.hero];
const UK_ABOUT_CREDENTIALS = { title: "Сертифікати" };
const UK_ABOUT_CTA = { title: "Напишіть мені" };
const THIRD_LOCALE_ABOUT_HERO = { title: "A third locale's hero" };
const THIRD_LOCALES = SEEDED_LOCALES.filter((locale) => locale.code !== UKRAINIAN.code);
const UK_SEO = { title: "Пошуковий заголовок сторінки", description: "Пошуковий опис сторінки" };

const ENGLISH_ABOUT_PAGE = {
  hero: ENGLISH_ABOUT_HERO,
  journey: FULL_SECTION_DATA[ABOUT.journey],
  credentials: FULL_SECTION_DATA[ABOUT.credentials],
  personal: FULL_SECTION_DATA[ABOUT.personal],
  cta: FULL_SECTION_DATA[ABOUT.cta],
  seo: FULL_SECTION_DATA[ABOUT.seo],
};

const FALLBACK_CASES: readonly (readonly [string, readonly UkHeroRow[], unknown])[] = [
  ["the English section when the uk row is missing", [], ENGLISH_ABOUT_HERO],
  [
    "the English section when the uk row is present and empty",
    [{ data: {}, isActive: true }],
    ENGLISH_ABOUT_HERO,
  ],
  [
    "the English section when the uk row is present and inactive",
    [{ data: UK_ABOUT_HERO, isActive: false }],
    ENGLISH_ABOUT_HERO,
  ],
  [
    "the English section when the uk row is present and unparsable",
    [{ data: UNPARSABLE_SECTION_DATA, isActive: true }],
    ENGLISH_ABOUT_HERO,
  ],
  [
    "the uk section when the uk row is present and valid",
    [{ data: UK_ABOUT_HERO, isActive: true }],
    UK_ABOUT_HERO,
  ],
];

const createAboutRows = async (rows: readonly AboutRowSeed[]): Promise<void> => {
  await cleanupRaw.marketingPageSection.createMany({
    data: rows.map((row) => ({ pageSlug: PageSlug.ABOUT, ...row })),
  });
};

const updateEnglishAboutHero = (data: Prisma.MarketingPageSectionUpdateInput): Promise<void> =>
  updateEnglishSection(PageSlug.ABOUT, ABOUT.hero, data);

describe("cmsPagesPublicApi — locales", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await seedLocaleCatalog();
    await seedSectionsWithOverrides(FULL_SECTION_DATA);
  });

  beforeEach(async () => {
    await cleanupRaw.marketingPageSection.deleteMany({
      where: { locale: { not: DEFAULT_LOCALE_CODE } },
    });
    await updateEnglishAboutHero({ data: ENGLISH_ABOUT_HERO, isActive: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  describe("fallback for about:hero against the same English row", () => {
    it.each(FALLBACK_CASES)("reads %s", async (_label, ukRows, expectedHero) => {
      await createAboutRows(
        ukRows.map((row) => ({ section: ABOUT.hero, locale: UKRAINIAN.code, ...row })),
      );

      const page = await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code);

      expect(page.hero).toEqual(expectedHero);
    });

    it("reads the uk section when the English row is inactive and the uk row is valid", async () => {
      await updateEnglishAboutHero({ isActive: false });
      await createAboutRows([
        { section: ABOUT.hero, locale: UKRAINIAN.code, data: UK_ABOUT_HERO, isActive: true },
      ]);

      const page = await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code);

      expect(page.hero).toEqual(UK_ABOUT_HERO);
    });

    it("answers null when neither the uk row nor the English row qualifies", async () => {
      await updateEnglishAboutHero({ data: UNPARSABLE_SECTION_DATA });
      await createAboutRows([
        { section: ABOUT.hero, locale: UKRAINIAN.code, data: UK_ABOUT_HERO, isActive: false },
      ]);

      const page = await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code);

      expect(page.hero).toBeNull();
    });

    it("never reads a third locale's row for a uk read and fetches the uk and English rows in one query", async () => {
      await updateEnglishAboutHero({ isActive: false });
      await createAboutRows([
        { section: ABOUT.cta, locale: UKRAINIAN.code, data: UK_ABOUT_CTA, isActive: true },
        ...THIRD_LOCALES.map((locale) => ({
          section: ABOUT.hero,
          locale: locale.code,
          data: THIRD_LOCALE_ABOUT_HERO,
          isActive: true,
        })),
      ]);

      const sectionQueries = vi.spyOn(prisma.marketingPageSection, "findMany");
      const page = await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code);

      expect(THIRD_LOCALES.map((locale) => locale.code)).toContain(GERMAN.code);
      expect(page.hero).toBeNull();
      expect(page.cta).toEqual(UK_ABOUT_CTA);
      expect(sectionQueries).toHaveBeenCalledTimes(1);
      expect(await fetchedLocales(sectionQueries.mock.results)).toEqual(
        [DEFAULT_LOCALE_CODE, UKRAINIAN.code].sort(),
      );
    });

    it("resolves every section of the page on its own", async () => {
      await createAboutRows([
        { section: ABOUT.hero, locale: UKRAINIAN.code, data: UK_ABOUT_HERO, isActive: true },
        { section: ABOUT.journey, locale: UKRAINIAN.code, data: {}, isActive: true },
        {
          section: ABOUT.credentials,
          locale: UKRAINIAN.code,
          data: UK_ABOUT_CREDENTIALS,
          isActive: false,
        },
        {
          section: ABOUT.personal,
          locale: UKRAINIAN.code,
          data: UNPARSABLE_SECTION_DATA,
          isActive: true,
        },
      ]);

      const page = await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code);

      expect(page).toEqual({ ...ENGLISH_ABOUT_PAGE, hero: UK_ABOUT_HERO });
    });

    it("reads the English rows for the default locale in one query per read even when uk rows exist", async () => {
      await seedSectionsWithOverrides(
        { [ABOUT.hero]: UK_ABOUT_HERO, [ABOUT.cta]: UK_ABOUT_CTA },
        UKRAINIAN.code,
      );

      const sectionQueries = vi.spyOn(prisma.marketingPageSection, "findMany");

      expect(await cmsPagesPublicApi.getAboutPage()).toEqual(ENGLISH_ABOUT_PAGE);
      expect(await cmsPagesPublicApi.getAboutPage(DEFAULT_LOCALE_CODE)).toEqual(ENGLISH_ABOUT_PAGE);
      expect(sectionQueries).toHaveBeenCalledTimes(2);
      expect(await fetchedLocales(sectionQueries.mock.results)).toEqual([DEFAULT_LOCALE_CODE]);
    });
  });

  describe("locale validation", () => {
    it("refuses a disabled locale exactly like an unknown one and issues no page query for either", async () => {
      const sectionQueries = vi.spyOn(prisma.marketingPageSection, "findMany");
      const productQueries = vi.spyOn(prisma.product, "findMany");

      await createAboutRows([
        { section: ABOUT.hero, locale: GERMAN.code, data: GERMAN_ABOUT_HERO, isActive: true },
      ]);

      const disabledRefusal = await refusalOf(cmsPagesPublicApi.getHomePage(GERMAN.code));

      await cleanupRaw.marketingPageSection.deleteMany({ where: { locale: GERMAN.code } });
      await cleanupRaw.marketingLocale.delete({ where: { code: GERMAN.code } });

      try {
        expect(await refusalOf(cmsPagesPublicApi.getHomePage(GERMAN.code))).toEqual(
          disabledRefusal,
        );
      } finally {
        await cleanupRaw.marketingLocale.create({ data: GERMAN });
      }

      expect(GERMAN.isEnabled).toBe(false);
      expect(disabledRefusal).toMatchObject({ name: NotFoundError.name, statusCode: 404 });
      expect(sectionQueries).not.toHaveBeenCalled();
      expect(productQueries).not.toHaveBeenCalled();
    });

    it.each(PAGE_READERS)(
      "%s takes the locale and refuses an unknown one",
      async (slug, readPage) => {
        const ukHero = { title: `Українська сторінка ${slug}` };

        await cleanupRaw.marketingPageSection.create({
          data: {
            pageSlug: slug,
            section: PAGE_SECTIONS_MAP[slug].hero,
            locale: UKRAINIAN.code,
            data: ukHero,
          },
        });

        expect((await readPage(UKRAINIAN.code)).hero).toEqual(ukHero);
        await expect(readPage(UNKNOWN_LOCALE_CODE)).rejects.toThrow(NotFoundError);
      },
    );
  });

  describe("seo section per page", () => {
    it.each(PAGE_READERS)(
      "%s falls back to the English seo section when the uk seo row is empty",
      async (slug, readPage) => {
        const seo = PAGE_SECTIONS_MAP[slug].seo;

        await cleanupRaw.marketingPageSection.create({
          data: { pageSlug: slug, section: seo, locale: UKRAINIAN.code, data: {} },
        });

        expect((await readPage(UKRAINIAN.code)).seo).toEqual(FULL_SECTION_DATA[seo]);
      },
    );

    it.each(PAGE_READERS)(
      "%s reads the uk seo section from its own row",
      async (slug, readPage) => {
        const seo = PAGE_SECTIONS_MAP[slug].seo;

        await cleanupRaw.marketingPageSection.create({
          data: { pageSlug: slug, section: seo, locale: UKRAINIAN.code, data: UK_SEO },
        });

        expect((await readPage(UKRAINIAN.code)).seo).toEqual(UK_SEO);
        expect((await readPage(DEFAULT_LOCALE_CODE)).seo).toEqual(FULL_SECTION_DATA[seo]);
      },
    );
  });
});

describe("cmsPagesPublicApi — default locale without its row", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await cleanupRaw.marketingLocale.deleteMany();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("reads the default locale on a database without the default locale row", async () => {
    const pages = await Promise.all(
      PAGE_READERS.map(([, readPage]) => readPage(DEFAULT_LOCALE_CODE)),
    );

    expect(pages.map((page) => page.hero)).toEqual(PAGE_READERS.map(() => null));
    expect(await cleanupRaw.marketingLocale.count()).toBe(0);
  });
});
