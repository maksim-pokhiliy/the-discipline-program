import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
  getHomePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
} from "@repo/contracts/cms/pages";

import { PARTIAL_SECTION_DATA } from "./__fixtures__/section-data";
import {
  restoreSections,
  seedSectionsWithOverrides,
  type SectionState,
} from "./__fixtures__/seed-with-overrides";
import { cmsPagesPublicApi } from "./public";

describe("cmsPagesPublicApi — partial DB (hero filled, other sections empty)", () => {
  let states: SectionState[] = [];
  let createdPageIds: string[] = [];

  beforeAll(async () => {
    ({ states, createdPageIds } = await seedSectionsWithOverrides({
      "home:hero": PARTIAL_SECTION_DATA["home:hero"],
      "storefront:hero": PARTIAL_SECTION_DATA["storefront:hero"],
      "about:hero": PARTIAL_SECTION_DATA["about:hero"],
      "blog:hero": PARTIAL_SECTION_DATA["blog:hero"],
      "contact:hero": PARTIAL_SECTION_DATA["contact:hero"],
      "faq:hero": PARTIAL_SECTION_DATA["faq:hero"],
    }));
  });

  afterAll(async () => {
    await restoreSections(states, createdPageIds);
  });

  it("getHomePage returns partial hero, null for empty sections", async () => {
    const data = await cmsPagesPublicApi.getHomePage();

    expect(data.hero).not.toBeNull();
    expect(data.hero?.title).toBe("Partial Home Hero");
    expect(data.whyChoose).toBeNull();
    expect(data.storefront).toBeNull();
    expect(data.reviews).toBeNull();
    expect(data.contact).toBeNull();
    expect(Array.isArray(data.productsList)).toBe(true);
    expect(Array.isArray(data.reviewsList)).toBe(true);
    expect(getHomePageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getStorefrontProgramsPage returns partial hero, null for empty sections", async () => {
    const data = await cmsPagesPublicApi.getStorefrontProgramsPage();

    expect(data.hero).not.toBeNull();
    expect(data.hero?.title).toBe("Partial Storefront Hero");
    expect(data.grid).toBeNull();
    expect(data.cta).toBeNull();
    expect(Array.isArray(data.productsList)).toBe(true);
    expect(getStorefrontProgramsPageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getAboutPage returns partial hero, null for empty sections", async () => {
    const data = await cmsPagesPublicApi.getAboutPage();

    expect(data.hero).not.toBeNull();
    expect(data.hero?.title).toBe("Partial About Hero");
    expect(data.journey).toBeNull();
    expect(data.credentials).toBeNull();
    expect(data.personal).toBeNull();
    expect(data.cta).toBeNull();
    expect(getAboutPageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getBlogPage returns partial hero, null for empty sections", async () => {
    const data = await cmsPagesPublicApi.getBlogPage();

    expect(data.hero).not.toBeNull();
    expect(data.hero?.title).toBe("Partial Blog Hero");
    expect(data.grid).toBeNull();
    expect(Array.isArray(data.posts)).toBe(true);
    expect(Array.isArray(data.categories)).toBe(true);
    expect(getBlogPageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getContactPage returns partial hero, null for empty sections", async () => {
    const data = await cmsPagesPublicApi.getContactPage();

    expect(data.hero).not.toBeNull();
    expect(data.hero?.title).toBe("Partial Contact Hero");
    expect(data.form).toBeNull();
    expect(Array.isArray(data.programOptions)).toBe(true);
    expect(getContactPageResponseSchema.safeParse(data).success).toBe(true);
  });

  it("getFaqPage returns partial hero, null for empty sections", async () => {
    const data = await cmsPagesPublicApi.getFaqPage();

    expect(data.hero).not.toBeNull();
    expect(data.hero?.title).toBe("Partial FAQ Hero");
    expect(data.content).toBeNull();
    expect(data.cta).toBeNull();
    expect(getFaqPageResponseSchema.safeParse(data).success).toBe(true);
  });
});
