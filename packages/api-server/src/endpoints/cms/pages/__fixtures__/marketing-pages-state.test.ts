import {
  type MarketingLocale,
  type MarketingPage,
  type MarketingPageSection,
} from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../../test/helpers";
import { marshalNullableJson } from "../../../../utils/to-input-json";
import { UKRAINIAN } from "../../locale/__fixtures__/locale-catalog";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  DEFAULT_LOCALE_ROW,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./marketing-pages-state";
import { seedSectionsWithOverrides } from "./seed-with-overrides";

const UNIQUE_VIOLATION = { code: "P2002" };

const ADDED_LOCALE_CODE = "de";
const PAGE_WITHOUT_SECTIONS_ID = "fixture-page-about";
const HOME_PAGE_ID = "fixture-page-home";
const NESTED_SECTION_ID = "fixture-section-hero";
const SECOND_LOCALE_SECTION_ID = "fixture-section-inactive-second-locale";
const JSON_NULL_SECTION_ID = "fixture-section-json-null";
const NON_CANONICAL_SECTION_ID = "fixture-section-retired";
const NON_CANONICAL_SECTION = "home:retiredBanner";
const ENGLISH_HERO = { title: "English hero" };
const SECOND_LOCALE_HERO = { title: "Український герой" };

const NESTED_NON_ASCII_DATA = {
  title: "Привіт, атлете — ünïcödé ✓",
  rows: [
    ["присід", ["5×5", "80 %"]],
    ["жим", []],
  ],
  meta: { tags: ["ß", "日本語"], depth: [[["深い"]]] },
};

const SEEDED_LOCALES: MarketingLocale[] = [
  {
    code: DEFAULT_LOCALE_CODE,
    name: "English, renamed before the capture",
    isEnabled: true,
    sortOrder: 2,
    createdAt: new Date("2020-01-02T03:04:05.006Z"),
    updatedAt: new Date("2020-01-03T04:05:06.007Z"),
  },
  {
    code: UKRAINIAN.code,
    name: UKRAINIAN.name,
    isEnabled: false,
    sortOrder: 1,
    createdAt: new Date("2020-02-02T03:04:05.006Z"),
    updatedAt: new Date("2020-02-03T04:05:06.007Z"),
  },
];

const SEEDED_PAGES: MarketingPage[] = [
  {
    id: PAGE_WITHOUT_SECTIONS_ID,
    slug: PageSlug.ABOUT,
    title: "About, a page without sections",
    createdAt: new Date("2021-01-02T03:04:05.006Z"),
    updatedAt: new Date("2021-01-03T04:05:06.007Z"),
  },
  {
    id: HOME_PAGE_ID,
    slug: PageSlug.HOME,
    title: "Home",
    createdAt: new Date("2021-02-02T03:04:05.006Z"),
    updatedAt: new Date("2021-02-03T04:05:06.007Z"),
  },
];

const SEEDED_SECTIONS: MarketingPageSection[] = [
  {
    id: NESTED_SECTION_ID,
    pageSlug: PageSlug.HOME,
    section: PAGE_SECTIONS_MAP.home.hero,
    locale: DEFAULT_LOCALE_CODE,
    data: NESTED_NON_ASCII_DATA,
    isActive: true,
    updatedAt: new Date("2021-03-01T01:02:03.004Z"),
  },
  {
    id: SECOND_LOCALE_SECTION_ID,
    pageSlug: PageSlug.HOME,
    section: PAGE_SECTIONS_MAP.home.whyChoose,
    locale: UKRAINIAN.code,
    data: { title: "Inactive why choose in the second locale" },
    isActive: false,
    updatedAt: new Date("2021-03-02T01:02:03.004Z"),
  },
  {
    id: JSON_NULL_SECTION_ID,
    pageSlug: PageSlug.HOME,
    section: PAGE_SECTIONS_MAP.home.reviews,
    locale: DEFAULT_LOCALE_CODE,
    data: null,
    isActive: true,
    updatedAt: new Date("2021-03-03T01:02:03.004Z"),
  },
  {
    id: NON_CANONICAL_SECTION_ID,
    pageSlug: PageSlug.HOME,
    section: NON_CANONICAL_SECTION,
    locale: DEFAULT_LOCALE_CODE,
    data: { title: "A section the page map does not know" },
    isActive: true,
    updatedAt: new Date("2021-03-04T01:02:03.004Z"),
  },
];

const SEEDED_STATE: MarketingPagesState = {
  locales: SEEDED_LOCALES,
  pages: SEEDED_PAGES,
  sections: SEEDED_SECTIONS,
};

const seedKnownContent = async (): Promise<void> => {
  await cleanupRaw.marketingLocale.deleteMany();
  await cleanupRaw.marketingLocale.createMany({ data: SEEDED_LOCALES });
  await cleanupRaw.marketingPage.createMany({ data: SEEDED_PAGES });
  await cleanupRaw.marketingPageSection.createMany({
    data: SEEDED_SECTIONS.map((section) => ({
      ...section,
      data: marshalNullableJson(section.data),
    })),
  });
};

const changeEveryTableAfterTheCapture = async (): Promise<void> => {
  await cleanupRaw.marketingPageSection.delete({ where: { id: SECOND_LOCALE_SECTION_ID } });
  await cleanupRaw.marketingLocale.delete({ where: { code: UKRAINIAN.code } });
  await cleanupRaw.marketingLocale.update({
    where: { code: DEFAULT_LOCALE_CODE },
    data: {
      name: "English, changed after the capture",
      isEnabled: false,
      sortOrder: 9,
      createdAt: new Date("2024-05-06T07:08:09.010Z"),
      updatedAt: new Date("2024-05-07T07:08:09.010Z"),
    },
  });
  await cleanupRaw.marketingLocale.create({
    data: { code: ADDED_LOCALE_CODE, name: "Added after the capture" },
  });
  await cleanupRaw.marketingPage.delete({ where: { id: PAGE_WITHOUT_SECTIONS_ID } });
  await cleanupRaw.marketingPageSection.update({
    where: { id: NESTED_SECTION_ID },
    data: {
      locale: ADDED_LOCALE_CODE,
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
      locale: ADDED_LOCALE_CODE,
      data: { title: "Added after the capture" },
    },
  });
};

const readTables = async (): Promise<MarketingPagesState> => ({
  locales: await cleanupRaw.marketingLocale.findMany({ orderBy: { code: "asc" } }),
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

  it("gives back every mapped column of the locales, pages and sections changed after the capture", async () => {
    await seedKnownContent();

    const captured = await captureMarketingPagesState();

    expect(captured).toEqual(SEEDED_STATE);

    await changeEveryTableAfterTheCapture();
    await restoreMarketingPagesState(captured);

    expect(await readTables()).toEqual(SEEDED_STATE);
  });

  it("leaves no pages, no sections and only the default locale when it clears them", async () => {
    await seedKnownContent();
    await clearMarketingPagesState();

    expect(await cleanupRaw.marketingPage.count()).toBe(0);
    expect(await cleanupRaw.marketingPageSection.count()).toBe(0);
    expect(
      await cleanupRaw.marketingLocale.findMany({
        select: { code: true, name: true, isEnabled: true, sortOrder: true },
      }),
    ).toEqual([DEFAULT_LOCALE_ROW]);
  });

  it("refuses to seed the default locale over pages and sections that were not cleared", async () => {
    await seedSectionsWithOverrides({});

    const sectionCount = await cleanupRaw.marketingPageSection.count();

    await expect(seedSectionsWithOverrides({})).rejects.toMatchObject(UNIQUE_VIOLATION);
    expect(await cleanupRaw.marketingPageSection.count()).toBe(sectionCount);
  });

  it("refuses to seed the default locale over pages that were not cleared, even without sections", async () => {
    await cleanupRaw.marketingPage.create({ data: { slug: PageSlug.ABOUT, title: "Left behind" } });

    await expect(seedSectionsWithOverrides({})).rejects.toMatchObject(UNIQUE_VIOLATION);
    expect(await cleanupRaw.marketingPageSection.count()).toBe(0);
  });

  it("seeds a non-default locale beside the default rows without touching them", async () => {
    await seedSectionsWithOverrides({ [PAGE_SECTIONS_MAP.home.hero]: ENGLISH_HERO });

    const before = await readTables();

    await seedSectionsWithOverrides(
      { [PAGE_SECTIONS_MAP.home.hero]: SECOND_LOCALE_HERO },
      UKRAINIAN.code,
    );

    const after = await readTables();
    const secondLocaleRows = after.sections
      .filter((section) => section.locale === UKRAINIAN.code)
      .map(({ pageSlug, section, data, isActive }) => ({ pageSlug, section, data, isActive }));
    const expectedSecondLocaleRows = Object.values(PageSlug).flatMap((pageSlug) =>
      Object.values(PAGE_SECTIONS_MAP[pageSlug]).map((section) => ({
        pageSlug,
        section,
        data: section === PAGE_SECTIONS_MAP.home.hero ? SECOND_LOCALE_HERO : {},
        isActive: true,
      })),
    );

    expect(after.pages).toEqual(before.pages);
    expect(after.sections.filter((section) => section.locale === DEFAULT_LOCALE_CODE)).toEqual(
      before.sections,
    );
    expect(after.locales).toEqual([
      ...before.locales,
      expect.objectContaining({
        code: UKRAINIAN.code,
        name: UKRAINIAN.code,
        isEnabled: true,
      }),
    ]);
    expect(secondLocaleRows).toHaveLength(expectedSecondLocaleRows.length);
    expect(secondLocaleRows).toEqual(expect.arrayContaining(expectedSecondLocaleRows));
  });
});
