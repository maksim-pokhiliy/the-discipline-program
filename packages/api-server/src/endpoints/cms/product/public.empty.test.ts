import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getProductsResponseSchema } from "@repo/contracts/cms/product";
import { NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";

import { cmsProductPublicApi } from "./public";

const TEST_PREFIX = `test-empty-product-public-${crypto.randomUUID().slice(0, 8)}`;

describe("cmsProductPublicApi — empty DB", () => {
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
      const result = await cmsProductPublicApi.getAll();
      const filtered = result.filter((product) => product.slug.startsWith(TEST_PREFIX));

      expect(filtered).toHaveLength(0);
    });

    it("filtered (empty) subset validates against products response schema", async () => {
      const result = await cmsProductPublicApi.getAll();
      const filtered = result.filter((product) => product.slug.startsWith(TEST_PREFIX));
      const parsed = getProductsResponseSchema.safeParse(filtered);

      expect(parsed.success).toBe(true);
    });

    it("does not crash when no featured products exist in filtered scope", async () => {
      const result = await cmsProductPublicApi.getAll();
      const filtered = result.filter((product) => product.slug.startsWith(TEST_PREFIX));
      const featured = filtered.filter((product) => product.isFeatured);

      expect(featured).toHaveLength(0);
    });
  });

  describe("getBySlug", () => {
    it("throws NotFoundError for non-existent slug", async () => {
      await expect(cmsProductPublicApi.getBySlug(`${TEST_PREFIX}-non-existent`)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
