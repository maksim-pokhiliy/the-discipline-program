import {
  type MarketingLocale,
  type MarketingPage,
  type MarketingPageSection,
  type ProductTranslation,
} from "@prisma/client";
import { expect } from "vitest";

import { DEFAULT_LOCALE_CODE, DEFAULT_LOCALE_NAME } from "@repo/contracts/cms/locale";

import { cleanupRaw } from "../../../../test/helpers";
import { marshalNullableJson, toInputJson } from "../../../../utils/to-input-json";

export type MarketingPagesState = {
  locales: MarketingLocale[];
  pages: MarketingPage[];
  sections: MarketingPageSection[];
  productTranslations: ProductTranslation[];
};

export const DEFAULT_LOCALE_ROW = {
  code: DEFAULT_LOCALE_CODE,
  name: DEFAULT_LOCALE_NAME,
  isEnabled: true,
  sortOrder: 0,
};

export const captureMarketingPagesState = async (): Promise<MarketingPagesState> => {
  const [locales, pages, sections, productTranslations] = await Promise.all([
    cleanupRaw.marketingLocale.findMany({ orderBy: { code: "asc" } }),
    cleanupRaw.marketingPage.findMany({ orderBy: { id: "asc" } }),
    cleanupRaw.marketingPageSection.findMany({ orderBy: { id: "asc" } }),
    cleanupRaw.productTranslation.findMany({ orderBy: { id: "asc" } }),
  ]);

  return { locales, pages, sections, productTranslations };
};

export const clearMarketingPagesState = async (): Promise<void> => {
  await cleanupRaw.$transaction([
    cleanupRaw.productTranslation.deleteMany(),
    cleanupRaw.marketingPageSection.deleteMany(),
    cleanupRaw.marketingPage.deleteMany(),
    cleanupRaw.marketingLocale.deleteMany(),
    cleanupRaw.marketingLocale.create({ data: DEFAULT_LOCALE_ROW }),
  ]);
};

export const restoreMarketingPagesState = async (state: MarketingPagesState): Promise<void> => {
  await cleanupRaw.$transaction([
    cleanupRaw.productTranslation.deleteMany(),
    cleanupRaw.marketingPageSection.deleteMany(),
    cleanupRaw.marketingPage.deleteMany(),
    cleanupRaw.marketingLocale.deleteMany(),
    cleanupRaw.marketingLocale.createMany({ data: state.locales }),
    cleanupRaw.productTranslation.createMany({
      data: state.productTranslations.map((translation) => ({
        ...translation,
        featureList: toInputJson(translation.featureList),
      })),
    }),
    cleanupRaw.marketingPage.createMany({ data: state.pages }),
    cleanupRaw.marketingPageSection.createMany({
      data: state.sections.map((section) => ({
        ...section,
        data: marshalNullableJson(section.data),
      })),
    }),
  ]);

  expect(
    await captureMarketingPagesState(),
    "the marketing locale, page, section and product translation tables differ from the snapshot after the restore",
  ).toEqual(state);
};
