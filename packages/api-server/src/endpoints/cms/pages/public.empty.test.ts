import { describe, expect, it } from "vitest";

import {
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
  getHomePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
} from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { cmsPagesPublicApi } from "./public";

const NON_EXISTENT_SUFFIX = crypto.randomUUID().slice(0, 8);

describe("cmsPagesPublicApi — empty DB", () => {
  it("getHomePage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getHomePage();

    const parsed = getHomePageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(Array.isArray(data.productsList)).toBe(true);
    expect(Array.isArray(data.reviewsList)).toBe(true);
  });

  it("getStorefrontProgramsPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getStorefrontProgramsPage();

    const parsed = getStorefrontProgramsPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(Array.isArray(data.productsList)).toBe(true);
  });

  it("getAboutPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getAboutPage();

    const parsed = getAboutPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
  });

  it("getBlogPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getBlogPage();

    const parsed = getBlogPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(Array.isArray(data.posts)).toBe(true);
    expect(Array.isArray(data.categories)).toBe(true);
  });

  it("getContactPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getContactPage();

    const parsed = getContactPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
    expect(Array.isArray(data.programOptions)).toBe(true);
  });

  it("getFaqPage returns valid response with null sections on cold DB", async () => {
    const data = await cmsPagesPublicApi.getFaqPage();

    const parsed = getFaqPageResponseSchema.safeParse(data);

    expect(parsed.success).toBe(true);
  });

  it("does not silently swallow unexpected errors for non-existent article slug", async () => {
    const { cmsBlogPublicApi } = await import("../blog/public");

    await expect(
      cmsBlogPublicApi.getArticle(`non-existent-slug-${NON_EXISTENT_SUFFIX}`),
    ).rejects.toThrow(NotFoundError);
  });
});
