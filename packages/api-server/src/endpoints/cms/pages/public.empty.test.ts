import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
  getHomePageResponseSchema,
  getOfferPageResponseSchema,
  getSitePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
} from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { cmsPagesPublicApi } from "./public";

const NON_EXISTENT_SUFFIX = crypto.randomUUID().slice(0, 8);

describe("cmsPagesPublicApi — empty DB", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("getHomePage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getHomePage();

    const parsed = getHomePageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(data.hero).toBeNull();
    expect(data.whyChoose).toBeNull();
    expect(data.storefront).toBeNull();
    expect(data.reviews).toBeNull();
    expect(data.contact).toBeNull();
    expect(data.seo).toBeNull();
  });

  it("getStorefrontProgramsPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getStorefrontProgramsPage();

    const parsed = getStorefrontProgramsPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(data.hero).toBeNull();
    expect(data.grid).toBeNull();
    expect(data.cta).toBeNull();
    expect(data.seo).toBeNull();
  });

  it("getAboutPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getAboutPage();

    const parsed = getAboutPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(data.hero).toBeNull();
    expect(data.journey).toBeNull();
    expect(data.credentials).toBeNull();
    expect(data.personal).toBeNull();
    expect(data.cta).toBeNull();
    expect(data.seo).toBeNull();
  });

  it("getBlogPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getBlogPage();

    const parsed = getBlogPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(data.hero).toBeNull();
    expect(data.grid).toBeNull();
    expect(data.seo).toBeNull();
  });

  it("getContactPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getContactPage();

    const parsed = getContactPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(data.hero).toBeNull();
    expect(data.form).toBeNull();
    expect(data.seo).toBeNull();
  });

  it("getFaqPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getFaqPage();

    const parsed = getFaqPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(data.hero).toBeNull();
    expect(data.content).toBeNull();
    expect(data.cta).toBeNull();
    expect(data.seo).toBeNull();
  });

  it("getOfferPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getOfferPage();

    expect(getOfferPageResponseSchema.safeParse(data).success).toBe(true);
    expect(data).toEqual({ hero: null, requisites: null, terms: null, seo: null });
  });

  it("getSitePage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getSitePage();

    expect(getSitePageResponseSchema.safeParse(data).success).toBe(true);
    expect(data).toEqual({ navigation: null, footer: null, leadForm: null, errors: null });
  });

  it("creates no page and no section row when it reads the site and the offer pages", async () => {
    await cmsPagesPublicApi.getSitePage();
    await cmsPagesPublicApi.getOfferPage();

    expect(await cleanupRaw.marketingPage.count()).toBe(0);
    expect(await cleanupRaw.marketingPageSection.count()).toBe(0);
  });

  it("does not silently swallow unexpected errors for non-existent article slug", async () => {
    const { cmsBlogPublicApi } = await import("../blog/public");

    await expect(
      cmsBlogPublicApi.getArticle(`non-existent-slug-${NON_EXISTENT_SUFFIX}`),
    ).rejects.toThrow(NotFoundError);
  });
});
