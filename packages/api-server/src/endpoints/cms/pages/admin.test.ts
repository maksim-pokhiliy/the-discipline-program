import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PageSlug, PAGE_SECTIONS_MAP } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";

import {
  captureMarketingState,
  clearMarketingState,
  restoreMarketingState,
  type MarketingState,
} from "./__fixtures__/marketing-state";
import { cmsPagesAdminApi } from "./admin";

const heroSectionData = {
  title: "Test Hero Title",
  subtitle: "Test Hero Subtitle",
  buttonText: "Test Button",
  buttonHref: "/test",
  backgroundImage: "/test.jpg",
};

describe("cmsPagesAdminApi", () => {
  let snapshot: MarketingState;
  let testPageId: string;

  beforeAll(async () => {
    snapshot = await captureMarketingState();
    await clearMarketingState();

    const page = await cleanupRaw.marketingPage.create({
      data: { slug: PageSlug.HOME, title: "Test Home Page" },
    });

    testPageId = page.id;
  });

  afterAll(async () => {
    await restoreMarketingState(snapshot);
  });

  describe("getPages", () => {
    it("returns an array of page list items", async () => {
      const pages = await cmsPagesAdminApi.getPages();

      expect(Array.isArray(pages)).toBe(true);

      const found = pages.find((p) => p.id === testPageId);

      expect(found).toBeDefined();
      expect(found?.slug).toBe(PageSlug.HOME);
      expect(found?.updatedAt).toBeInstanceOf(Date);
    });

    it("each page has required fields", async () => {
      const pages = await cmsPagesAdminApi.getPages();

      for (const page of pages) {
        expect(page.id).toBeDefined();
        expect(page.slug).toBeDefined();
        expect(page.title).toBeDefined();
        expect(page.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe("getPageBySlug", () => {
    it("throws NotFoundError for non-existent slug", async () => {
      await expect(cmsPagesAdminApi.getPageBySlug("non-existent-slug")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("updatePageMetadata", () => {
    it("updates page title and SEO fields", async () => {
      await cmsPagesAdminApi.updatePageMetadata(PageSlug.HOME, {
        title: "Updated Home Page",
        seoTitle: "Updated SEO Title",
        seoDesc: "Updated SEO Description",
      });

      const pages = await cmsPagesAdminApi.getPages();
      const updated = pages.find((p) => p.id === testPageId);

      expect(updated?.title).toBe("Updated Home Page");
    });

    it("allows nullable SEO fields", async () => {
      await cmsPagesAdminApi.updatePageMetadata(PageSlug.HOME, {
        title: "Home Page Reset",
        seoTitle: null,
        seoDesc: null,
      });

      const pages = await cmsPagesAdminApi.getPages();
      const updated = pages.find((p) => p.id === testPageId);

      expect(updated?.title).toBe("Home Page Reset");
    });
  });

  describe("updateSection", () => {
    it("throws NotFoundError for a section that is not canonical for the page", async () => {
      await expect(
        cmsPagesAdminApi.updateSection({
          pageSlug: PageSlug.HOME,
          section: PAGE_SECTIONS_MAP.about.hero,
          data: heroSectionData,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("upserts a canonical section that does not exist yet", async () => {
      const where = { pageSlug: PageSlug.HOME, section: PAGE_SECTIONS_MAP.home.reviews };

      expect(await cleanupRaw.marketingPageSection.findFirst({ where })).toBeNull();

      await cmsPagesAdminApi.updateSection({
        pageSlug: PageSlug.HOME,
        section: PAGE_SECTIONS_MAP.home.reviews,
        data: { title: "Lazy Reviews" },
      });

      const created = await cleanupRaw.marketingPageSection.findFirst({ where });

      expect(created).not.toBeNull();
      expect(created?.data).toMatchObject({ title: "Lazy Reviews" });
    });
  });
});
