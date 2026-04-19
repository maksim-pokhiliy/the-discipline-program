import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  PAGE_SECTIONS_MAP,
  PageSlug,
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
  getHomePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
} from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../test/helpers";

import { cmsPagesPublicApi } from "./public";

describe("cmsPagesPublicApi — bootstrapped DB (sections with data={})", () => {
  type SectionState = {
    id: string;
    pageSlug: string;
    section: string;
    wasCreated: boolean;
    previousData: Prisma.JsonValue;
  };
  const sectionStates: SectionState[] = [];
  const createdPageIds: string[] = [];

  beforeAll(async () => {
    for (const slug of Object.values(PageSlug)) {
      const existingPage = await cleanupRaw.marketingPage.findUnique({ where: { slug } });

      if (!existingPage) {
        const page = await cleanupRaw.marketingPage.create({ data: { slug, title: slug } });

        createdPageIds.push(page.id);
      }

      for (const section of Object.values(PAGE_SECTIONS_MAP[slug])) {
        const existing = await cleanupRaw.marketingPageSection.findFirst({
          where: { pageSlug: slug, section },
        });

        if (existing) {
          sectionStates.push({
            id: existing.id,
            pageSlug: slug,
            section,
            wasCreated: false,
            previousData: existing.data,
          });
          await cleanupRaw.marketingPageSection.update({
            where: { id: existing.id },
            data: { data: {} },
          });
        } else {
          const created = await cleanupRaw.marketingPageSection.create({
            data: { pageSlug: slug, section, data: {}, isActive: true },
          });

          sectionStates.push({
            id: created.id,
            pageSlug: slug,
            section,
            wasCreated: true,
            previousData: {},
          });
        }
      }
    }
  });

  afterAll(async () => {
    for (const { id, pageSlug, section, wasCreated, previousData } of sectionStates) {
      if (wasCreated) {
        await cleanupRaw.marketingPageSection.delete({ where: { id } }).catch(() => {});
      } else {
        await cleanupRaw.marketingPageSection.updateMany({
          where: { pageSlug, section },
          data: { data: JSON.parse(JSON.stringify(previousData)) as Prisma.InputJsonValue },
        });
      }
    }

    for (const id of createdPageIds.reverse()) {
      await cleanupRaw.marketingPage.delete({ where: { id } }).catch(() => {});
    }
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
