import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import {
  isPublicPageSlug,
  PAGE_SECTIONS_MAP,
  PageSlug,
  SECTION_DEFAULTS,
} from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../test/helpers";
import { FRENCH, seedLocaleCatalog, UKRAINIAN } from "../locale/__fixtures__/locale-catalog";
import { cmsLocaleAdminApi } from "../locale/admin";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA } from "./__fixtures__/section-data";
import { cmsPagesAdminApi } from "./admin";

type ScaffoldRow = { section: string; data: unknown };

const SITE = PAGE_SECTIONS_MAP.site;
const OFFER = PAGE_SECTIONS_MAP.offer;
const PUBLIC_PAGE_SLUGS = Object.values(PageSlug).filter(isPublicPageSlug);
const NON_DEFAULT_LOCALES = [UKRAINIAN.code, FRENCH.code];
const SECTION_COUNT = Object.values(PageSlug).flatMap((slug) =>
  Object.values(PAGE_SECTIONS_MAP[slug]),
).length;

const bySection = (rows: readonly ScaffoldRow[]): ScaffoldRow[] =>
  [...rows].sort((a, b) => a.section.localeCompare(b.section));

const readScaffold = async (pageSlug: PageSlug, locale: LocaleCode): Promise<ScaffoldRow[]> =>
  bySection(
    await cleanupRaw.marketingPageSection.findMany({
      where: { pageSlug, locale },
      select: { section: true, data: true },
    }),
  );

const scaffoldEveryPage = async (locale: LocaleCode): Promise<void> => {
  for (const slug of Object.values(PageSlug)) {
    await cmsPagesAdminApi.getPageBySlug(slug, locale);
  }
};

describe("cmsPagesAdminApi — the scaffold and the English defaults", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("scaffolds the English site page with the English default of every site section", async () => {
    const details = await cmsPagesAdminApi.getPageBySlug(PageSlug.SITE);
    const expectedRows = Object.values(SITE).map((section) => ({
      section,
      data: SECTION_DEFAULTS[section],
    }));

    expect(await readScaffold(PageSlug.SITE, DEFAULT_LOCALE_CODE)).toEqual(bySection(expectedRows));
    expect(details.sections.map(({ section, data }) => ({ section, data }))).toEqual(expectedRows);
  });

  it("scaffolds the English offer page with empty content sections and the seo default", async () => {
    await cmsPagesAdminApi.getPageBySlug(PageSlug.OFFER);

    expect(await readScaffold(PageSlug.OFFER, DEFAULT_LOCALE_CODE)).toEqual(
      bySection([
        { section: OFFER.hero, data: {} },
        { section: OFFER.requisites, data: {} },
        { section: OFFER.terms, data: {} },
        { section: OFFER.seo, data: SECTION_DEFAULTS[OFFER.seo] },
      ]),
    );
  });

  it.each(PUBLIC_PAGE_SLUGS)(
    "scaffolds the English seo section of %s with its default",
    async (slug) => {
      const seo = PAGE_SECTIONS_MAP[slug].seo;

      await cmsPagesAdminApi.getPageBySlug(slug);

      expect(await readScaffold(slug, DEFAULT_LOCALE_CODE)).toEqual(
        bySection(
          Object.values(PAGE_SECTIONS_MAP[slug]).map((section) => ({
            section,
            data: section === seo ? SECTION_DEFAULTS[seo] : {},
          })),
        ),
      );
    },
  );

  it("never overwrites an English row that already exists, filled or cleared", async () => {
    await cleanupRaw.marketingPage.create({ data: { slug: PageSlug.SITE, title: "Site" } });
    await cleanupRaw.marketingPageSection.createMany({
      data: [
        { pageSlug: PageSlug.SITE, section: SITE.footer, data: FULL_SECTION_DATA[SITE.footer] },
        { pageSlug: PageSlug.SITE, section: SITE.navigation, data: {} },
      ],
    });

    await cmsPagesAdminApi.getPageBySlug(PageSlug.SITE);

    expect(await readScaffold(PageSlug.SITE, DEFAULT_LOCALE_CODE)).toEqual(
      bySection([
        { section: SITE.navigation, data: {} },
        { section: SITE.footer, data: FULL_SECTION_DATA[SITE.footer] },
        { section: SITE.leadForm, data: SECTION_DEFAULTS[SITE.leadForm] },
        { section: SITE.errors, data: SECTION_DEFAULTS[SITE.errors] },
      ]),
    );
  });

  it.each(NON_DEFAULT_LOCALES)(
    "scaffolds a %s page with empty rows only, so the locale stays deletable",
    async (locale) => {
      await scaffoldEveryPage(locale);

      expect(await cleanupRaw.marketingPageSection.count({ where: { locale } })).toBe(
        SECTION_COUNT,
      );
      await cmsLocaleAdminApi.deleteLocale(locale);

      expect(await cleanupRaw.marketingLocale.findUnique({ where: { code: locale } })).toBeNull();
      expect(await cleanupRaw.marketingPageSection.count({ where: { locale } })).toBe(0);
    },
  );

  it.each(NON_DEFAULT_LOCALES)(
    "writes nothing to English when it scaffolds a %s page",
    async (locale) => {
      await scaffoldEveryPage(locale);

      expect(
        await cleanupRaw.marketingPageSection.count({ where: { locale: DEFAULT_LOCALE_CODE } }),
      ).toBe(0);
    },
  );
});
