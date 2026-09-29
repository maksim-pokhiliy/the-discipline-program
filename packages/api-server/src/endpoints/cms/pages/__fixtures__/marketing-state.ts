import { type MarketingPage, type MarketingPageSection } from "@prisma/client";
import { expect } from "vitest";

import { cleanupRaw } from "../../../../test/helpers";
import { marshalNullableJson } from "../../../../utils/to-input-json";

export type MarketingState = {
  pages: MarketingPage[];
  sections: MarketingPageSection[];
};

export async function captureMarketingState(): Promise<MarketingState> {
  const [pages, sections] = await Promise.all([
    cleanupRaw.marketingPage.findMany({ orderBy: { id: "asc" } }),
    cleanupRaw.marketingPageSection.findMany({ orderBy: { id: "asc" } }),
  ]);

  return { pages, sections };
}

export async function clearMarketingState(): Promise<void> {
  await cleanupRaw.$transaction([
    cleanupRaw.marketingPageSection.deleteMany(),
    cleanupRaw.marketingPage.deleteMany(),
  ]);
}

export async function restoreMarketingState(state: MarketingState): Promise<void> {
  await cleanupRaw.$transaction([
    cleanupRaw.marketingPageSection.deleteMany(),
    cleanupRaw.marketingPage.deleteMany(),
    cleanupRaw.marketingPage.createMany({ data: state.pages }),
    cleanupRaw.marketingPageSection.createMany({
      data: state.sections.map((section) => ({
        ...section,
        data: marshalNullableJson(section.data),
      })),
    }),
  ]);

  expect(
    await captureMarketingState(),
    "the marketing tables differ from the snapshot after the restore",
  ).toEqual(state);
}
