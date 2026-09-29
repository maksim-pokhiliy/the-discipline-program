import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PAGE_SECTIONS_MAP, PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../test/helpers";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA } from "./__fixtures__/section-data";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { cmsPagesPublicApi } from "./public";

const INVALID_SECTION_DATA = { title: 42 };

const updateSection = async (
  pageSlug: PageSlug,
  section: SectionSchemaKey,
  data: Prisma.MarketingPageSectionUpdateInput,
): Promise<void> => {
  await cleanupRaw.marketingPageSection.update({
    where: { pageSlug_section: { pageSlug, section } },
    data,
  });
};

const PAGE_READERS: readonly (readonly [PageSlug, () => Promise<unknown>])[] = [
  [PageSlug.HOME, () => cmsPagesPublicApi.getHomePage()],
  [PageSlug.STOREFRONT, () => cmsPagesPublicApi.getStorefrontProgramsPage()],
  [PageSlug.ABOUT, () => cmsPagesPublicApi.getAboutPage()],
  [PageSlug.BLOG, () => cmsPagesPublicApi.getBlogPage()],
  [PageSlug.CONTACT, () => cmsPagesPublicApi.getContactPage()],
  [PageSlug.FAQ, () => cmsPagesPublicApi.getFaqPage()],
];

const sectionsWithInactiveHero = (slug: PageSlug): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(PAGE_SECTIONS_MAP[slug])
      .filter(([, section]) => section !== PAGE_SECTIONS_MAP.blog.related)
      .map(([field, section]) => [
        field,
        section === PAGE_SECTIONS_MAP[slug].hero ? null : FULL_SECTION_DATA[section],
      ]),
  );

describe("cmsPagesPublicApi", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await seedSectionsWithOverrides(FULL_SECTION_DATA);
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  describe("getHomePage", () => {
    it("returns home page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getHomePage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["home:hero"]);
      expect(data.whyChoose).toEqual(FULL_SECTION_DATA["home:whyChoose"]);
      expect(data.storefront).toEqual(FULL_SECTION_DATA["home:storefront"]);
      expect(data.reviews).toEqual(FULL_SECTION_DATA["home:reviews"]);
      expect(data.contact).toEqual(FULL_SECTION_DATA["home:contact"]);
    });
  });

  describe("getStorefrontProgramsPage", () => {
    it("returns storefront page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getStorefrontProgramsPage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["storefront:hero"]);
      expect(data.grid).toEqual(FULL_SECTION_DATA["storefront:grid"]);
      expect(data.cta).toEqual(FULL_SECTION_DATA["storefront:cta"]);
    });
  });

  describe("getAboutPage", () => {
    it("returns about page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getAboutPage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["about:hero"]);
      expect(data.journey).toEqual(FULL_SECTION_DATA["about:journey"]);
      expect(data.credentials).toEqual(FULL_SECTION_DATA["about:credentials"]);
      expect(data.personal).toEqual(FULL_SECTION_DATA["about:personal"]);
      expect(data.cta).toEqual(FULL_SECTION_DATA["about:cta"]);
    });
  });

  describe("inactive sections", () => {
    it.each(PAGE_READERS)(
      "answers null for the inactive hero of %s and the payload for its other sections",
      async (slug, readPage) => {
        const hero = PAGE_SECTIONS_MAP[slug].hero;

        await updateSection(slug, hero, { isActive: false });

        try {
          expect(await readPage()).toEqual(expect.objectContaining(sectionsWithInactiveHero(slug)));
        } finally {
          await updateSection(slug, hero, { isActive: true });
        }
      },
    );
  });

  describe("getBlogPage", () => {
    it("returns blog page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getBlogPage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["blog:hero"]);
      expect(data.grid).toEqual(FULL_SECTION_DATA["blog:grid"]);
    });
  });

  describe("getContactPage", () => {
    it("returns contact page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getContactPage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["contact:hero"]);
      expect(data.form).toEqual(FULL_SECTION_DATA["contact:form"]);
    });
  });

  describe("getFaqPage", () => {
    it("returns faq page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getFaqPage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["faq:hero"]);
      expect(data.content).toEqual(FULL_SECTION_DATA["faq:content"]);
      expect(data.cta).toEqual(FULL_SECTION_DATA["faq:cta"]);
    });

    it("answers null for a section whose stored data does not fit its schema", async () => {
      await updateSection(PageSlug.FAQ, PAGE_SECTIONS_MAP.faq.content, {
        data: INVALID_SECTION_DATA,
      });

      try {
        const data = await cmsPagesPublicApi.getFaqPage();

        expect(data.content).toBeNull();
        expect(data.hero).toEqual(FULL_SECTION_DATA["faq:hero"]);
        expect(data.cta).toEqual(FULL_SECTION_DATA["faq:cta"]);
      } finally {
        await updateSection(PageSlug.FAQ, PAGE_SECTIONS_MAP.faq.content, {
          data: FULL_SECTION_DATA["faq:content"],
        });
      }
    });
  });
});
