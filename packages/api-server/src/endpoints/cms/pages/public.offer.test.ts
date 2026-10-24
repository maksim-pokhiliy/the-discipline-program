import { type Prisma } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import {
  getOfferPageResponseSchema,
  PAGE_SECTIONS_MAP,
  PageSlug,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { defaultMonitoring } from "../../../infrastructure/monitoring";
import { cleanupRaw } from "../../../test/helpers";
import { GERMAN, seedLocaleCatalog, UKRAINIAN } from "../locale/__fixtures__/locale-catalog";

import { refusalsOfDisabledAndUnknownLocale } from "./__fixtures__/disabled-locale-refusal";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA, UNPARSABLE_SECTION_DATA } from "./__fixtures__/section-data";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { updateEnglishSection } from "./__fixtures__/update-english-section";
import { cmsPagesPublicApi } from "./public";

type UkOfferRow = { section: SectionSchemaKey; data: Prisma.InputJsonValue; isActive: boolean };

type UkRequisitesRow = Omit<UkOfferRow, "section">;

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

const REQUISITES_FALLBACK_CASES: readonly (readonly [string, readonly UkRequisitesRow[]])[] = [
  ["missing", []],
  ["present and empty", [{ data: {}, isActive: true }]],
  ["present and inactive", [{ data: UK_REQUISITES, isActive: false }]],
  ["present and unparsable", [{ data: UNPARSABLE_SECTION_DATA, isActive: true }]],
];

const createUkOfferRows = async (rows: readonly UkOfferRow[]): Promise<void> => {
  await cleanupRaw.marketingPageSection.createMany({
    data: rows.map((row) => ({ pageSlug: PageSlug.OFFER, locale: UKRAINIAN.code, ...row })),
  });
};

const ukRequisitesRows = (rows: readonly UkRequisitesRow[]): UkOfferRow[] =>
  rows.map((row) => ({ section: OFFER.requisites, ...row }));

const updateEnglishRequisites = (data: Prisma.MarketingPageSectionUpdateInput): Promise<void> =>
  updateEnglishSection(PageSlug.OFFER, OFFER.requisites, data);

describe("cmsPagesPublicApi.getOfferPage", () => {
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
    await updateEnglishRequisites({ data: ENGLISH_REQUISITES, isActive: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("reads the hero, the requisite rows, the terms blocks and the seo section in English", async () => {
    const page = await cmsPagesPublicApi.getOfferPage();

    expect(page).toEqual(ENGLISH_OFFER_PAGE);
    expect(getOfferPageResponseSchema.parse(page)).toEqual(ENGLISH_OFFER_PAGE);
  });

  it("reads the requisites and the terms from their own uk rows and the rest from English", async () => {
    await createUkOfferRows([
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
      await createUkOfferRows(ukRequisitesRows(ukRows));

      const page = await cmsPagesPublicApi.getOfferPage(UKRAINIAN.code);

      expect(page.requisites).toEqual(ENGLISH_REQUISITES);
    },
  );

  it("answers null when neither the uk row nor the English row qualifies", async () => {
    await updateEnglishRequisites({ data: UNPARSABLE_SECTION_DATA });
    await createUkOfferRows(ukRequisitesRows([{ data: UK_REQUISITES, isActive: false }]));

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
      await createUkOfferRows(
        ukRequisitesRows([{ data: UK_REQUISITES_WITHOUT_VALUE, isActive: true }]),
      );

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
