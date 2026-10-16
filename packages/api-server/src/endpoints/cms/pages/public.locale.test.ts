import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import {
  GERMAN,
  SEEDED_LOCALES,
  seedLocaleCatalog,
  UKRAINIAN,
} from "../locale/__fixtures__/locale-catalog";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA, UK_ABOUT_HERO } from "./__fixtures__/section-data";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { cmsPagesPublicApi } from "./public";

type AboutRowSeed = {
  section: SectionSchemaKey;
  locale: LocaleCode;
  data: Prisma.InputJsonValue;
  isActive: boolean;
};

type UkHeroRow = Pick<AboutRowSeed, "data" | "isActive">;

const UNKNOWN_LOCALE_CODE = "xx";
const UNPARSABLE_SECTION_DATA = { title: 42 };
const ABOUT = PAGE_SECTIONS_MAP.about;
const ENGLISH_ABOUT_HERO = FULL_SECTION_DATA[ABOUT.hero];
const UK_ABOUT_CREDENTIALS = { title: "Сертифікати" };
const UK_ABOUT_CTA = { title: "Напишіть мені" };
const GERMAN_ABOUT_HERO = { title: "Über mich" };
const THIRD_LOCALE_ABOUT_HERO = { title: "A third locale's hero" };
const THIRD_LOCALES = SEEDED_LOCALES.filter((locale) => locale.code !== UKRAINIAN.code);

const ENGLISH_ABOUT_PAGE = {
  hero: ENGLISH_ABOUT_HERO,
  journey: FULL_SECTION_DATA[ABOUT.journey],
  credentials: FULL_SECTION_DATA[ABOUT.credentials],
  personal: FULL_SECTION_DATA[ABOUT.personal],
  cta: FULL_SECTION_DATA[ABOUT.cta],
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

const PAGE_READERS: readonly (readonly [
  PageSlug,
  (locale: LocaleCode) => Promise<{ hero: unknown }>,
])[] = [
  [PageSlug.HOME, cmsPagesPublicApi.getHomePage],
  [PageSlug.STOREFRONT, cmsPagesPublicApi.getStorefrontProgramsPage],
  [PageSlug.ABOUT, cmsPagesPublicApi.getAboutPage],
  [PageSlug.BLOG, cmsPagesPublicApi.getBlogPage],
  [PageSlug.CONTACT, cmsPagesPublicApi.getContactPage],
  [PageSlug.FAQ, cmsPagesPublicApi.getFaqPage],
];

const createAboutRows = async (rows: readonly AboutRowSeed[]): Promise<void> => {
  await cleanupRaw.marketingPageSection.createMany({
    data: rows.map((row) => ({ pageSlug: PageSlug.ABOUT, ...row })),
  });
};

const updateEnglishAboutHero = async (
  data: Prisma.MarketingPageSectionUpdateInput,
): Promise<void> => {
  await cleanupRaw.marketingPageSection.update({
    where: {
      pageSlug_section_locale: {
        pageSlug: PageSlug.ABOUT,
        section: ABOUT.hero,
        locale: DEFAULT_LOCALE_CODE,
      },
    },
    data,
  });
};

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

    it("never reads a third locale's row for a uk read", async () => {
      await updateEnglishAboutHero({ isActive: false });
      await createAboutRows(
        THIRD_LOCALES.map((locale) => ({
          section: ABOUT.hero,
          locale: locale.code,
          data: THIRD_LOCALE_ABOUT_HERO,
          isActive: true,
        })),
      );

      const page = await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code);

      expect(THIRD_LOCALES.map((locale) => locale.code)).toContain(GERMAN.code);
      expect(page.hero).toBeNull();
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

    it("reads the English rows for the default locale even when uk rows exist", async () => {
      await seedSectionsWithOverrides(
        { [ABOUT.hero]: UK_ABOUT_HERO, [ABOUT.cta]: UK_ABOUT_CTA },
        UKRAINIAN.code,
      );

      expect(await cmsPagesPublicApi.getAboutPage()).toEqual(ENGLISH_ABOUT_PAGE);
      expect(await cmsPagesPublicApi.getAboutPage(DEFAULT_LOCALE_CODE)).toEqual(ENGLISH_ABOUT_PAGE);
    });
  });

  describe("locale validation", () => {
    it("refuses an unknown locale with NotFoundError", async () => {
      await expect(cmsPagesPublicApi.getAboutPage(UNKNOWN_LOCALE_CODE)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("refuses a disabled locale with NotFoundError", async () => {
      await createAboutRows([
        { section: ABOUT.hero, locale: GERMAN.code, data: GERMAN_ABOUT_HERO, isActive: true },
      ]);

      expect(GERMAN.isEnabled).toBe(false);
      await expect(cmsPagesPublicApi.getAboutPage(GERMAN.code)).rejects.toThrow(NotFoundError);
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
