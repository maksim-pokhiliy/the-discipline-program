import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
  getHomePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
} from "@repo/contracts/cms/pages";

import {
  captureMarketingState,
  clearMarketingState,
  restoreMarketingState,
  type MarketingState,
} from "./__fixtures__/marketing-state";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { cmsPagesPublicApi } from "./public";

describe("cmsPagesPublicApi — bootstrapped DB (sections with data={})", () => {
  let snapshot: MarketingState;

  beforeAll(async () => {
    snapshot = await captureMarketingState();
    await clearMarketingState();
    await seedSectionsWithOverrides({});
  });

  afterAll(async () => {
    await restoreMarketingState(snapshot);
  });

  it("getHomePage returns null sections without throwing", async () => {
    const data = await cmsPagesPublicApi.getHomePage();

    expect(data.hero).toBeNull();
    expect(data.whyChoose).toBeNull();
    expect(data.storefront).toBeNull();
    expect(data.reviews).toBeNull();
    expect(data.contact).toBeNull();
    expect(Array.isArray(data.productsList)).toBe(true);
    expect(Array.isArray(data.reviewsList)).toBe(true);
    expect(getHomePageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getStorefrontProgramsPage returns null sections without throwing", async () => {
    const data = await cmsPagesPublicApi.getStorefrontProgramsPage();

    expect(data.hero).toBeNull();
    expect(data.grid).toBeNull();
    expect(data.cta).toBeNull();
    expect(Array.isArray(data.productsList)).toBe(true);
    expect(getStorefrontProgramsPageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getAboutPage returns null sections without throwing", async () => {
    const data = await cmsPagesPublicApi.getAboutPage();

    expect(data.hero).toBeNull();
    expect(data.journey).toBeNull();
    expect(data.credentials).toBeNull();
    expect(data.personal).toBeNull();
    expect(data.cta).toBeNull();
    expect(getAboutPageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getBlogPage returns null sections without throwing", async () => {
    const data = await cmsPagesPublicApi.getBlogPage();

    expect(data.hero).toBeNull();
    expect(data.grid).toBeNull();
    expect(Array.isArray(data.posts)).toBe(true);
    expect(Array.isArray(data.categories)).toBe(true);
    expect(getBlogPageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getContactPage returns null sections without throwing", async () => {
    const data = await cmsPagesPublicApi.getContactPage();

    expect(data.hero).toBeNull();
    expect(data.form).toBeNull();
    expect(Array.isArray(data.programOptions)).toBe(true);
    expect(getContactPageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getFaqPage returns null sections without throwing", async () => {
    const data = await cmsPagesPublicApi.getFaqPage();

    expect(data.hero).toBeNull();
    expect(data.content).toBeNull();
    expect(data.cta).toBeNull();
    expect(getFaqPageResponseSchema.safeParse(data).success).toBe(true);
  });
});
