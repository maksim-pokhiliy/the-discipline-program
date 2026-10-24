import { type Prisma } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { getSitePageResponseSchema, PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { cleanupRaw } from "../../../test/helpers";
import {
  GERMAN,
  seedLocaleCatalog,
  UKRAINIAN,
  UNKNOWN_LOCALE_CODE,
} from "../locale/__fixtures__/locale-catalog";

import { refusalsOfDisabledAndUnknownLocale } from "./__fixtures__/disabled-locale-refusal";
import { fetchedLocales } from "./__fixtures__/fetched-locales";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA } from "./__fixtures__/section-data";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { updateEnglishSection } from "./__fixtures__/update-english-section";
import { cmsPagesPublicApi } from "./public";

type UkFooterRow = { data: Prisma.InputJsonValue; isActive: boolean };

const SITE = PAGE_SECTIONS_MAP.site;
const ENGLISH_FOOTER = FULL_SECTION_DATA[SITE.footer];
const UK_FOOTER = {
  tagline: "Тестове гасло підвалу",
  subcopy: "Тестовий підпис підвалу",
  rightsLabel: "Тестові права",
};
const UNPARSABLE_FOOTER = { tagline: 42 };

const ENGLISH_SITE_PAGE = {
  navigation: FULL_SECTION_DATA[SITE.navigation],
  footer: ENGLISH_FOOTER,
  leadForm: FULL_SECTION_DATA[SITE.leadForm],
  errors: FULL_SECTION_DATA[SITE.errors],
};

const FOOTER_FALLBACK_CASES: readonly (readonly [string, readonly UkFooterRow[]])[] = [
  ["missing", []],
  ["present and empty", [{ data: {}, isActive: true }]],
  ["present and inactive", [{ data: UK_FOOTER, isActive: false }]],
  ["present and unparsable", [{ data: UNPARSABLE_FOOTER, isActive: true }]],
];

const createUkFooterRows = async (rows: readonly UkFooterRow[]): Promise<void> => {
  await cleanupRaw.marketingPageSection.createMany({
    data: rows.map((row) => ({
      pageSlug: PageSlug.SITE,
      section: SITE.footer,
      locale: UKRAINIAN.code,
      ...row,
    })),
  });
};

const updateEnglishFooter = (data: Prisma.MarketingPageSectionUpdateInput): Promise<void> =>
  updateEnglishSection(PageSlug.SITE, SITE.footer, data);

describe("cmsPagesPublicApi.getSitePage", () => {
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
    await updateEnglishFooter({ data: ENGLISH_FOOTER, isActive: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  describe("the default locale", () => {
    it("reads every site section from its English row in a shape the response schema takes", async () => {
      const page = await cmsPagesPublicApi.getSitePage();

      expect(page).toEqual(ENGLISH_SITE_PAGE);
      expect(getSitePageResponseSchema.parse(page)).toEqual(ENGLISH_SITE_PAGE);
    });

    it("answers null for a site section whose English row is inactive", async () => {
      await updateEnglishFooter({ isActive: false });

      expect(await cmsPagesPublicApi.getSitePage()).toEqual({ ...ENGLISH_SITE_PAGE, footer: null });
    });

    it("reads the default locale without a catalog lookup", async () => {
      const localeLookups = vi.spyOn(prisma.marketingLocale, "findUnique");
      const sectionQueries = vi.spyOn(prisma.marketingPageSection, "findMany");

      expect(await cmsPagesPublicApi.getSitePage()).toEqual(ENGLISH_SITE_PAGE);
      expect(await cmsPagesPublicApi.getSitePage(DEFAULT_LOCALE_CODE)).toEqual(ENGLISH_SITE_PAGE);
      expect(localeLookups).not.toHaveBeenCalled();
      expect(sectionQueries).toHaveBeenCalledTimes(2);
    });
  });

  describe("another locale", () => {
    it("reads a site section from its own uk row and the others from English", async () => {
      await createUkFooterRows([{ data: UK_FOOTER, isActive: true }]);

      expect(await cmsPagesPublicApi.getSitePage(UKRAINIAN.code)).toEqual({
        ...ENGLISH_SITE_PAGE,
        footer: UK_FOOTER,
      });
    });

    it.each(FOOTER_FALLBACK_CASES)(
      "falls back to the English site section when the uk row is %s",
      async (_label, ukRows) => {
        await createUkFooterRows(ukRows);

        const page = await cmsPagesPublicApi.getSitePage(UKRAINIAN.code);

        expect(page.footer).toEqual(ENGLISH_FOOTER);
      },
    );

    it("answers null when neither the uk row nor the English row qualifies", async () => {
      await updateEnglishFooter({ data: UNPARSABLE_FOOTER });
      await createUkFooterRows([{ data: UK_FOOTER, isActive: false }]);

      const page = await cmsPagesPublicApi.getSitePage(UKRAINIAN.code);

      expect(page).toEqual({ ...ENGLISH_SITE_PAGE, footer: null });
    });

    it("fetches the uk and English site rows in one query", async () => {
      await createUkFooterRows([{ data: UK_FOOTER, isActive: true }]);

      const sectionQueries = vi.spyOn(prisma.marketingPageSection, "findMany");
      const page = await cmsPagesPublicApi.getSitePage(UKRAINIAN.code);

      expect(page.footer).toEqual(UK_FOOTER);
      expect(sectionQueries).toHaveBeenCalledTimes(1);
      expect(await fetchedLocales(sectionQueries.mock.results)).toEqual(
        [DEFAULT_LOCALE_CODE, UKRAINIAN.code].sort(),
      );
    });
  });

  describe("locale guard", () => {
    it("refuses an unknown locale with NotFoundError before any page query", async () => {
      const sectionQueries = vi.spyOn(prisma.marketingPageSection, "findMany");

      await expect(cmsPagesPublicApi.getSitePage(UNKNOWN_LOCALE_CODE)).rejects.toThrow(
        NotFoundError,
      );
      expect(sectionQueries).not.toHaveBeenCalled();
    });

    it("refuses a disabled locale with the same NotFoundError, before any page query", async () => {
      const sectionQueries = vi.spyOn(prisma.marketingPageSection, "findMany");

      const refusals = await refusalsOfDisabledAndUnknownLocale(cmsPagesPublicApi.getSitePage);

      expect(GERMAN.isEnabled).toBe(false);
      expect(refusals.disabled).toMatchObject({ name: NotFoundError.name, statusCode: 404 });
      expect(refusals.disabled).toEqual(refusals.unknown);
      expect(sectionQueries).not.toHaveBeenCalled();
    });
  });
});
