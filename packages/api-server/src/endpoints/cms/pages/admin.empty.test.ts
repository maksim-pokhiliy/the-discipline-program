import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

const TEST_PREFIX = `test-empty-pages-admin-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsPagesAdminApi — empty DB", () => {
  let snapshot: MarketingState;

  beforeAll(async () => {
    snapshot = await captureMarketingState();
  });

  beforeEach(async () => {
    await clearMarketingState();
  });

  afterAll(async () => {
    await restoreMarketingState(snapshot);

    expect(await captureMarketingState()).toEqual(snapshot);
  });

  describe("getPages", () => {
    it("returns an array", async () => {
      const result = await cmsPagesAdminApi.getPages();

      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array when filtered to test prefix slugs", async () => {
      const result = await cmsPagesAdminApi.getPages();
      const filtered = result.filter((page) => page.slug.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("every returned page has required fields", async () => {
      const result = await cmsPagesAdminApi.getPages();

      for (const page of result) {
        expect(page.id).toBeDefined();
        expect(typeof page.id).toBe("string");
        expect(page.slug).toBeDefined();
        expect(typeof page.title).toBe("string");
        expect(page.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe("getPageBySlug", () => {
    it("throws NotFoundError for non-existent slug", async () => {
      await expect(cmsPagesAdminApi.getPageBySlug(`${TEST_PREFIX}-non-existent`)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("lazy materialization", () => {
    it("getPages materializes and includes every canonical page slug", async () => {
      expect(await cleanupRaw.marketingPage.count()).toBe(0);

      const pages = await cmsPagesAdminApi.getPages();

      for (const slug of Object.values(PageSlug)) {
        expect(pages.some((page) => page.slug === slug)).toBe(true);
      }

      expect(await cleanupRaw.marketingPage.count()).toBe(Object.values(PageSlug).length);
    });

    it("getPageBySlug resolves a valid slug and returns its canonical sections", async () => {
      const homeSections = Object.values(PAGE_SECTIONS_MAP.home);

      expect(await cleanupRaw.marketingPageSection.count()).toBe(0);

      const details = await cmsPagesAdminApi.getPageBySlug(PageSlug.HOME);
      const persisted = await cleanupRaw.marketingPageSection.findMany({
        where: { pageSlug: PageSlug.HOME },
        select: { section: true, data: true },
      });

      expect(details.slug).toBe(PageSlug.HOME);
      expect(details.sections).toHaveLength(homeSections.length);
      expect(persisted).toHaveLength(homeSections.length);
      expect(persisted).toEqual(
        expect.arrayContaining(homeSections.map((section) => ({ section, data: {} }))),
      );
    });
  });
});
