import { type Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { getOfferPageResponseSchema, PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { defaultMonitoring } from "../../../infrastructure/monitoring";
import { GERMAN, UKRAINIAN } from "../locale/__fixtures__/locale-catalog";

import { refusalsOfDisabledAndUnknownLocale } from "./__fixtures__/disabled-locale-refusal";
import { setupLocalizedPageState } from "./__fixtures__/localized-page-state";
import { insertSectionRows } from "./__fixtures__/localized-section-rows";
import { FULL_SECTION_DATA, UNPARSABLE_SECTION_DATA } from "./__fixtures__/section-data";
import { sectionFallbackCases, seedUnqualifiedSectionRows } from "./__fixtures__/section-fallback";
import { updateEnglishSection } from "./__fixtures__/update-english-section";
import { cmsPagesPublicApi } from "./public";

const OFFER = PAGE_SECTIONS_MAP.offer;
const ENGLISH_REQUISITES = FULL_SECTION_DATA[OFFER.requisites];
const UK_REQUISITES = {
  title: "Тестові реквізити",
  items: [{ label: "Тестовий продавець", value: "Тестове значення" }],
};
const UK_TERMS = {
  title: "Тестові умови",
  blocks: [{ heading: "Тестова оплата", body: "Тестовий текст умов" }],
};
const UK_REQUISITES_WITHOUT_VALUE = {
  title: "Тестові реквізити без значення",
  items: [{ label: "Тестовий рядок" }],
};
const ENGLISH_REQUISITES_WITHOUT_VALUE = {
  title: "Requisites without a value",
  items: [{ label: "Seller" }],
};

const ENGLISH_OFFER_PAGE = {
  hero: FULL_SECTION_DATA[OFFER.hero],
  requisites: ENGLISH_REQUISITES,
  terms: FULL_SECTION_DATA[OFFER.terms],
  seo: FULL_SECTION_DATA[OFFER.seo],
};

const REQUISITES_FALLBACK_CASES = sectionFallbackCases(
  OFFER.requisites,
  UK_REQUISITES,
  UNPARSABLE_SECTION_DATA,
);

const updateEnglishRequisites = (data: Prisma.MarketingPageSectionUpdateInput): Promise<void> =>
  updateEnglishSection(PageSlug.OFFER, OFFER.requisites, data);

describe("cmsPagesPublicApi.getOfferPage", () => {
  setupLocalizedPageState(() =>
    updateEnglishRequisites({ data: ENGLISH_REQUISITES, isActive: true }),
  );

  it("reads the hero, the requisite rows, the terms blocks and the seo section in English", async () => {
    const page = await cmsPagesPublicApi.getOfferPage();

    expect(page).toEqual(ENGLISH_OFFER_PAGE);
    expect(getOfferPageResponseSchema.parse(page)).toEqual(ENGLISH_OFFER_PAGE);
  });

  it("reads the requisites and the terms from their own uk rows and the rest from English", async () => {
    await insertSectionRows(PageSlug.OFFER, UKRAINIAN.code, [
      { section: OFFER.requisites, data: UK_REQUISITES, isActive: true },
      { section: OFFER.terms, data: UK_TERMS, isActive: true },
    ]);

    expect(await cmsPagesPublicApi.getOfferPage(UKRAINIAN.code)).toEqual({
      ...ENGLISH_OFFER_PAGE,
      requisites: UK_REQUISITES,
      terms: UK_TERMS,
    });
  });

  it.each(REQUISITES_FALLBACK_CASES)(
    "falls back to the English requisites when the uk row is %s",
    async (_label, ukRows) => {
      await insertSectionRows(PageSlug.OFFER, UKRAINIAN.code, ukRows);

      const page = await cmsPagesPublicApi.getOfferPage(UKRAINIAN.code);

      expect(page.requisites).toEqual(ENGLISH_REQUISITES);
    },
  );

  it("answers null when neither the uk row nor the English row qualifies", async () => {
    await seedUnqualifiedSectionRows(
      PageSlug.OFFER,
      UKRAINIAN.code,
      { section: OFFER.requisites, data: UK_REQUISITES },
      UNPARSABLE_SECTION_DATA,
    );

    const page = await cmsPagesPublicApi.getOfferPage(UKRAINIAN.code);

    expect(page).toEqual({ ...ENGLISH_OFFER_PAGE, requisites: null });
  });

  it("refuses a disabled locale with the same NotFoundError as an unknown one, before any page query", async () => {
    const sectionQueries = vi.spyOn(prisma.marketingPageSection, "findMany");

    const refusals = await refusalsOfDisabledAndUnknownLocale(cmsPagesPublicApi.getOfferPage);

    expect(GERMAN.isEnabled).toBe(false);
    expect(refusals.disabled).toMatchObject({ name: NotFoundError.name, statusCode: 404 });
    expect(refusals.disabled).toEqual(refusals.unknown);
    expect(sectionQueries).not.toHaveBeenCalled();
  });

  describe("a requisite row whose value is not filled in yet", () => {
    it("serves the uk requisites with the partial row from the uk row, with no fallback and no warning", async () => {
      await insertSectionRows(PageSlug.OFFER, UKRAINIAN.code, [
        { section: OFFER.requisites, data: UK_REQUISITES_WITHOUT_VALUE, isActive: true },
      ]);

      const warnings = vi.spyOn(defaultMonitoring, "captureException");
      const page = await cmsPagesPublicApi.getOfferPage(UKRAINIAN.code);

      expect(page.requisites).toEqual(UK_REQUISITES_WITHOUT_VALUE);
      expect(warnings).not.toHaveBeenCalled();
    });

    it("serves the English requisites with the partial row as stored, with no warning", async () => {
      await updateEnglishRequisites({ data: ENGLISH_REQUISITES_WITHOUT_VALUE });

      const warnings = vi.spyOn(defaultMonitoring, "captureException");
      const page = await cmsPagesPublicApi.getOfferPage();

      expect(page.requisites).toEqual(ENGLISH_REQUISITES_WITHOUT_VALUE);
      expect(warnings).not.toHaveBeenCalled();
    });
  });
});
