import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../test/helpers";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";
import { seedSectionsWithOverrides } from "../pages/__fixtures__/seed-with-overrides";

import { UKRAINIAN, UNKNOWN_LOCALE_CODE } from "./__fixtures__/locale-catalog";

const UNIQUE_VIOLATION = { code: "P2002" };
const FOREIGN_KEY_VIOLATION = { code: "P2003" };
const NON_CANONICAL_SECTION = "home:retiredBanner";
const HERO_ROW = { pageSlug: PageSlug.HOME, section: PAGE_SECTIONS_MAP.home.hero };
const SECTION_INDEXES = [
  "marketing_page_sections_pageSlug_locale_isActive_idx",
  "marketing_page_sections_pageSlug_section_locale_key",
  "marketing_page_sections_pkey",
];

let snapshot: MarketingPagesState;

beforeAll(async () => {
  snapshot = await captureMarketingPagesState();
});

beforeEach(async () => {
  await clearMarketingPagesState();
  await seedSectionsWithOverrides({});
});

afterAll(async () => {
  await restoreMarketingPagesState(snapshot);
});

describe("marketing_page_sections_pageSlug_section_locale_key", () => {
  it("refuses a second row for the same page, section and locale", async () => {
    await expect(
      cleanupRaw.marketingPageSection.create({
        data: { ...HERO_ROW, locale: DEFAULT_LOCALE_CODE, data: { title: "A second hero" } },
      }),
    ).rejects.toMatchObject(UNIQUE_VIOLATION);

    const rowCount = await cleanupRaw.marketingPageSection.count({
      where: { ...HERO_ROW, locale: DEFAULT_LOCALE_CODE },
    });

    expect(rowCount).toBe(1);
  });

  it("accepts the same page and section under another locale", async () => {
    await cleanupRaw.marketingLocale.create({
      data: { code: UKRAINIAN.code, name: UKRAINIAN.name },
    });

    await expect(
      cleanupRaw.marketingPageSection.create({
        data: { ...HERO_ROW, locale: UKRAINIAN.code, data: { title: "Герой" } },
      }),
    ).resolves.toMatchObject({ ...HERO_ROW, locale: UKRAINIAN.code });

    const rowCount = await cleanupRaw.marketingPageSection.count({ where: HERO_ROW });

    expect(rowCount).toBe(2);
  });
});

describe("marketing_page_sections_locale_fkey", () => {
  it("refuses to delete a locale that a section row carries", async () => {
    await cleanupRaw.marketingLocale.create({
      data: { code: UKRAINIAN.code, name: UKRAINIAN.name },
    });
    await cleanupRaw.marketingPageSection.create({
      data: { ...HERO_ROW, locale: UKRAINIAN.code, data: {} },
    });

    await expect(
      cleanupRaw.marketingLocale.delete({ where: { code: UKRAINIAN.code } }),
    ).rejects.toMatchObject(FOREIGN_KEY_VIOLATION);

    const localeCount = await cleanupRaw.marketingLocale.count({
      where: { code: UKRAINIAN.code },
    });

    expect(localeCount).toBe(1);
  });

  it("refuses a section row whose locale does not exist", async () => {
    const sectionCount = await cleanupRaw.marketingPageSection.count();

    await expect(
      cleanupRaw.marketingPageSection.create({
        data: { ...HERO_ROW, locale: UNKNOWN_LOCALE_CODE, data: {} },
      }),
    ).rejects.toMatchObject(FOREIGN_KEY_VIOLATION);

    expect(await cleanupRaw.marketingPageSection.count()).toBe(sectionCount);
  });
});

describe("marketing_page_sections.locale", () => {
  it("defaults to the default locale code when an insert omits it", async () => {
    await expect(
      cleanupRaw.marketingPageSection.create({
        data: { pageSlug: PageSlug.HOME, section: NON_CANONICAL_SECTION, data: {} },
      }),
    ).resolves.toMatchObject({ section: NON_CANONICAL_SECTION, locale: DEFAULT_LOCALE_CODE });
  });
});

describe("marketing_locales.isEnabled", () => {
  it("starts a locale disabled when a Prisma create omits the flag", async () => {
    await expect(
      cleanupRaw.marketingLocale.create({ data: { code: UKRAINIAN.code, name: UKRAINIAN.name } }),
    ).resolves.toMatchObject({ code: UKRAINIAN.code, isEnabled: false });
  });

  it("starts a locale disabled when an SQL insert omits the column", async () => {
    const inserted = await cleanupRaw.$queryRaw<{ isEnabled: boolean }[]>`
      insert into marketing_locales (code, name, "updatedAt")
      values (${UKRAINIAN.code}, ${UKRAINIAN.name}, now())
      returning "isEnabled"`;

    expect(inserted).toEqual([{ isEnabled: false }]);
  });
});

describe("marketing_page_sections indexes", () => {
  it("carries the locale-scoped unique key and index and neither of the two they replaced", async () => {
    const indexes = await cleanupRaw.$queryRaw<{ indexname: string }[]>`
      select indexname
      from pg_indexes
      where schemaname = current_schema() and tablename = 'marketing_page_sections'
      order by indexname collate "C"`;

    expect(indexes.map((index) => index.indexname)).toEqual(SECTION_INDEXES);
  });
});
