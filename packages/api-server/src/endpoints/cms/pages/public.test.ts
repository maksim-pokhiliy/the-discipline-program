import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  captureMarketingState,
  clearMarketingState,
  restoreMarketingState,
  type MarketingState,
} from "./__fixtures__/marketing-state";
import { FULL_SECTION_DATA } from "./__fixtures__/section-data";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { cmsPagesPublicApi } from "./public";

describe("cmsPagesPublicApi", () => {
  let snapshot: MarketingState;

  beforeAll(async () => {
    snapshot = await captureMarketingState();
    await clearMarketingState();
    await seedSectionsWithOverrides(FULL_SECTION_DATA);
  });

  afterAll(async () => {
    await restoreMarketingState(snapshot);
  });

  describe("getHomePage", () => {
    it("returns home page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getHomePage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["home:hero"]);
      expect(data.whyChoose).toEqual(FULL_SECTION_DATA["home:whyChoose"]);
      expect(data.storefront).toEqual(FULL_SECTION_DATA["home:storefront"]);
      expect(data.reviews).toEqual(FULL_SECTION_DATA["home:reviews"]);
      expect(data.contact).toEqual(FULL_SECTION_DATA["home:contact"]);
      expect(Array.isArray(data.productsList)).toBe(true);
      expect(Array.isArray(data.reviewsList)).toBe(true);
    });
  });

  describe("getStorefrontProgramsPage", () => {
    it("returns storefront page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getStorefrontProgramsPage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["storefront:hero"]);
      expect(data.grid).toEqual(FULL_SECTION_DATA["storefront:grid"]);
      expect(data.cta).toEqual(FULL_SECTION_DATA["storefront:cta"]);
      expect(Array.isArray(data.productsList)).toBe(true);
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

  describe("getBlogPage", () => {
    it("returns blog page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getBlogPage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["blog:hero"]);
      expect(data.grid).toEqual(FULL_SECTION_DATA["blog:grid"]);
      expect(Array.isArray(data.posts)).toBe(true);
      expect(Array.isArray(data.categories)).toBe(true);
    });
  });

  describe("getContactPage", () => {
    it("returns contact page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getContactPage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["contact:hero"]);
      expect(data.form).toEqual(FULL_SECTION_DATA["contact:form"]);
      expect(Array.isArray(data.programOptions)).toBe(true);
    });
  });

  describe("getFaqPage", () => {
    it("returns faq page data with expected shape", async () => {
      const data = await cmsPagesPublicApi.getFaqPage();

      expect(data.hero).toEqual(FULL_SECTION_DATA["faq:hero"]);
      expect(data.content).toEqual(FULL_SECTION_DATA["faq:content"]);
      expect(data.cta).toEqual(FULL_SECTION_DATA["faq:cta"]);
    });
  });
});
