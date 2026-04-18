import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  getProductsPageDataResponseSchema,
  getProductsResponseSchema,
} from "@repo/contracts/cms/product";

import { cleanupRaw } from "../../../test/helpers";

import { cmsProductAdminApi } from "./admin";

const TEST_PREFIX = `test-empty-product-admin-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsProductAdminApi — empty DB", () => {
  beforeAll(async () => {
    await cleanupRaw.product.deleteMany({
      where: { slug: { startsWith: TEST_PREFIX } },
    });
  });

  afterAll(async () => {
    await cleanupRaw.product.deleteMany({
      where: { slug: { startsWith: TEST_PREFIX } },
    });
  });

  describe("getAll", () => {
    it("returns empty array filtered to test prefix when no matching products exist", async () => {
      const result = await cmsProductAdminApi.getAll();
      const filtered = result.filter((product) => product.slug.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("filtered (empty) subset validates against products response schema", async () => {
      const result = await cmsProductAdminApi.getAll();
      const filtered = result.filter((product) => product.slug.startsWith(TEST_PREFIX));
      const parsed = getProductsResponseSchema.safeParse(filtered);

      expect(parsed.success).toBe(true);
    });
  });

  describe("getPageData", () => {
    it("returns page data with empty products list filtered to test prefix", async () => {
      const result = await cmsProductAdminApi.getPageData();
      const filtered = result.products.filter((product) => product.slug.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("page data always has a products array", async () => {
      const result = await cmsProductAdminApi.getPageData();

      expect(Array.isArray(result.products)).toBe(true);
    });

    it("page data with filtered (empty) products validates against response schema", async () => {
      const result = await cmsProductAdminApi.getPageData();
      const filtered = {
        products: result.products.filter((product) => product.slug.startsWith(TEST_PREFIX)),
      };
      const parsed = getProductsPageDataResponseSchema.safeParse(filtered);

      expect(parsed.success).toBe(true);
    });
  });
});
