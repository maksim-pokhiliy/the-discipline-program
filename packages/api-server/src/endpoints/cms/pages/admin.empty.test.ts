import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PageSlug, PAGE_SECTIONS_MAP } from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { cmsPagesAdminApi } from "./admin";

const TEST_PREFIX = `test-empty-pages-admin-${crypto.randomUUID().slice(0, 8)}`;
const NON_CANONICAL_SLUG = "retired-landing";

describe("cmsPagesAdminApi — empty DB", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  describe("getPages", () => {
    it("leaves out a stored page whose slug is not canonical", async () => {
      await cleanupRaw.marketingPage.create({
        data: { slug: NON_CANONICAL_SLUG, title: "A page the site no longer has" },
      });

      const result = await cmsPagesAdminApi.getPages();

      expect(await cleanupRaw.marketingPage.count({ where: { slug: NON_CANONICAL_SLUG } })).toBe(1);
      expect(result.map((page) => page.slug)).not.toContain(NON_CANONICAL_SLUG);
    });

    it("every returned page has required fields", async () => {
      const result = await cmsPagesAdminApi.getPages();

      for (const page of result) {
        expect(typeof page.id).toBe("string");
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
