import { type MarketingPage, type MarketingPageSection } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../../test/helpers";
import { marshalNullableJson } from "../../../../utils/to-input-json";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./marketing-pages-state";
import { seedSectionsWithOverrides } from "./seed-with-overrides";

const UNIQUE_VIOLATION = { code: "P2002" };

const PAGE_WITHOUT_SECTIONS_ID = "fixture-page-about";
const HOME_PAGE_ID = "fixture-page-home";
const NESTED_SECTION_ID = "fixture-section-hero";
const INACTIVE_SECTION_ID = "fixture-section-inactive";
const JSON_NULL_SECTION_ID = "fixture-section-json-null";
const NON_CANONICAL_SECTION_ID = "fixture-section-retired";
const NON_CANONICAL_SECTION = "home:retiredBanner";

const NESTED_NON_ASCII_DATA = {
  title: "Привіт, атлете — ünïcödé ✓",
  rows: [
    ["присід", ["5×5", "80 %"]],
    ["жим", []],
  ],
  meta: { tags: ["ß", "日本語"], depth: [[["深い"]]] },
};

const SEEDED_PAGES: MarketingPage[] = [
  {
    id: PAGE_WITHOUT_SECTIONS_ID,
    slug: PageSlug.ABOUT,
    title: "About, a page without sections",
    seoTitle: null,
    seoDesc: null,
    createdAt: new Date("2021-01-02T03:04:05.006Z"),
    updatedAt: new Date("2021-01-03T04:05:06.007Z"),
  },
  {
    id: HOME_PAGE_ID,
    slug: PageSlug.HOME,
    title: "Home",
    seoTitle: "Home SEO title",
    seoDesc: "Home SEO description",
    createdAt: new Date("2021-02-02T03:04:05.006Z"),
    updatedAt: new Date("2021-02-03T04:05:06.007Z"),
  },
];

const SEEDED_SECTIONS: MarketingPageSection[] = [
  {
    id: NESTED_SECTION_ID,
    pageSlug: PageSlug.HOME,
    section: PAGE_SECTIONS_MAP.home.hero,
    data: NESTED_NON_ASCII_DATA,
    isActive: true,
    updatedAt: new Date("2021-03-01T01:02:03.004Z"),
  },
  {
    id: INACTIVE_SECTION_ID,
    pageSlug: PageSlug.HOME,
    section: PAGE_SECTIONS_MAP.home.whyChoose,
    data: { title: "Inactive why choose" },
    isActive: false,
    updatedAt: new Date("2021-03-02T01:02:03.004Z"),
  },
  {
    id: JSON_NULL_SECTION_ID,
    pageSlug: PageSlug.HOME,
    section: PAGE_SECTIONS_MAP.home.reviews,
    data: null,
    isActive: true,
    updatedAt: new Date("2021-03-03T01:02:03.004Z"),
  },
  {
    id: NON_CANONICAL_SECTION_ID,
    pageSlug: PageSlug.HOME,
    section: NON_CANONICAL_SECTION,
    data: { title: "A section the page map does not know" },
    isActive: true,
    updatedAt: new Date("2021-03-04T01:02:03.004Z"),
  },
];

const SEEDED_STATE: MarketingPagesState = { pages: SEEDED_PAGES, sections: SEEDED_SECTIONS };

const seedKnownContent = async (): Promise<void> => {
  await cleanupRaw.marketingPage.createMany({ data: SEEDED_PAGES });
  await cleanupRaw.marketingPageSection.createMany({
    data: SEEDED_SECTIONS.map((section) => ({
      ...section,
      data: marshalNullableJson(section.data),
    })),
  });
};

const readTables = async (): Promise<MarketingPagesState> => ({
  pages: await cleanupRaw.marketingPage.findMany({ orderBy: { id: "asc" } }),
  sections: await cleanupRaw.marketingPageSection.findMany({ orderBy: { id: "asc" } }),
});

describe("marketing pages state fixture", () => {
  let realState: MarketingPagesState;

  beforeAll(async () => {
    realState = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(realState);
  });

  it("gives back every column of the pages and sections changed after the capture", async () => {
    await seedKnownContent();

    const captured = await captureMarketingPagesState();

    expect(captured).toEqual(SEEDED_STATE);

    await cleanupRaw.marketingPage.delete({ where: { id: PAGE_WITHOUT_SECTIONS_ID } });
    await cleanupRaw.marketingPageSection.update({
      where: { id: NESTED_SECTION_ID },
      data: {
        data: { title: "Changed after the capture" },
        isActive: false,
        updatedAt: new Date("2024-05-06T07:08:09.010Z"),
      },
    });
    await cleanupRaw.marketingPage.create({
      data: { slug: PageSlug.CONTACT, title: "Added after the capture" },
    });
    await cleanupRaw.marketingPageSection.create({
      data: {
        pageSlug: PageSlug.CONTACT,
        section: PAGE_SECTIONS_MAP.contact.hero,
        data: { title: "Added after the capture" },
      },
    });

    await restoreMarketingPagesState(captured);

    expect(await readTables()).toEqual(SEEDED_STATE);
  });

  it("leaves both tables empty when it clears them", async () => {
    await seedKnownContent();
    await clearMarketingPagesState();

    expect(await cleanupRaw.marketingPage.count()).toBe(0);
    expect(await cleanupRaw.marketingPageSection.count()).toBe(0);
  });

  it("refuses to seed the pages over tables that were not cleared", async () => {
    await seedSectionsWithOverrides({});

    await expect(seedSectionsWithOverrides({})).rejects.toMatchObject(UNIQUE_VIOLATION);
  });
});
