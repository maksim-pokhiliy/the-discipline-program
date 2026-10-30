import { type Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { getSitePageResponseSchema, PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { GERMAN, UKRAINIAN, UNKNOWN_LOCALE_CODE } from "../locale/__fixtures__/locale-catalog";

import { refusalsOfDisabledAndUnknownLocale } from "./__fixtures__/disabled-locale-refusal";
import { fetchedLocales } from "./__fixtures__/fetched-locales";
import { setupLocalizedPageState } from "./__fixtures__/localized-page-state";
import { insertSectionRows } from "./__fixtures__/localized-section-rows";
import { FULL_SECTION_DATA } from "./__fixtures__/section-data";
import { sectionFallbackCases, seedUnqualifiedSectionRows } from "./__fixtures__/section-fallback";
import { updateEnglishSection } from "./__fixtures__/update-english-section";
import { cmsPagesPublicApi } from "./public";

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

const FOOTER_FALLBACK_CASES = sectionFallbackCases(SITE.footer, UK_FOOTER, UNPARSABLE_FOOTER);

const updateEnglishFooter = (data: Prisma.MarketingPageSectionUpdateInput): Promise<void> =>
  updateEnglishSection(PageSlug.SITE, SITE.footer, data);

describe("cmsPagesPublicApi.getSitePage", () => {
  setupLocalizedPageState(() => updateEnglishFooter({ data: ENGLISH_FOOTER, isActive: true }));

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
      await insertSectionRows(PageSlug.SITE, UKRAINIAN.code, [
        { section: SITE.footer, data: UK_FOOTER, isActive: true },
      ]);

      expect(await cmsPagesPublicApi.getSitePage(UKRAINIAN.code)).toEqual({
        ...ENGLISH_SITE_PAGE,
        footer: UK_FOOTER,
      });
    });

    it.each(FOOTER_FALLBACK_CASES)(
      "falls back to the English site section when the uk row is %s",
      async (_label, ukRows) => {
        await insertSectionRows(PageSlug.SITE, UKRAINIAN.code, ukRows);

        const page = await cmsPagesPublicApi.getSitePage(UKRAINIAN.code);

        expect(page.footer).toEqual(ENGLISH_FOOTER);
      },
    );

    it("answers null when neither the uk row nor the English row qualifies", async () => {
      await seedUnqualifiedSectionRows(
        PageSlug.SITE,
        UKRAINIAN.code,
        { section: SITE.footer, data: UK_FOOTER },
        UNPARSABLE_FOOTER,
      );

      const page = await cmsPagesPublicApi.getSitePage(UKRAINIAN.code);

      expect(page).toEqual({ ...ENGLISH_SITE_PAGE, footer: null });
    });

    it("fetches the uk and English site rows in one query", async () => {
      await insertSectionRows(PageSlug.SITE, UKRAINIAN.code, [
        { section: SITE.footer, data: UK_FOOTER, isActive: true },
      ]);

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
