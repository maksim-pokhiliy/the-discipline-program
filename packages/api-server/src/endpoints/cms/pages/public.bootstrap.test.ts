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
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { cmsPagesPublicApi } from "./public";

describe("cmsPagesPublicApi — bootstrapped DB (sections with data={})", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await seedSectionsWithOverrides({});
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("getHomePage returns null sections without throwing", async () => {
    const data = await cmsPagesPublicApi.getHomePage();

    expect(data.hero).toBeNull();
    expect(data.whyChoose).toBeNull();
    expect(data.storefront).toBeNull();
    expect(data.reviews).toBeNull();
    expect(data.contact).toBeNull();
    expect(getHomePageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getStorefrontProgramsPage returns null sections without throwing", async () => {
    const data = await cmsPagesPublicApi.getStorefrontProgramsPage();

    expect(data.hero).toBeNull();
    expect(data.grid).toBeNull();
    expect(data.cta).toBeNull();
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
    expect(getBlogPageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getContactPage returns null sections without throwing", async () => {
    const data = await cmsPagesPublicApi.getContactPage();

    expect(data.hero).toBeNull();
    expect(data.form).toBeNull();
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
