import { afterAll, describe, expect, it } from "vitest";

import { PriceInterval, ProductCurrency } from "@repo/contracts/cms/product";
import { NotFoundError } from "@repo/errors";

import { cmsBlogAdminApi } from "../endpoints/cms/blog/admin";
import { cmsProductAdminApi } from "../endpoints/cms/product/admin";

import { cleanup, cleanupRaw, createTestBlogPost } from "./helpers";

const createSlug = () => `test-${crypto.randomUUID().slice(0, 12)}`;

describe("workflows", () => {
  describe("CMS product lifecycle", () => {
    const toCleanup: { table: string; id: string }[] = [];

    afterAll(async () => {
      await cleanup(...toCleanup);
    });

    it("create -> toggleStatus -> toggleFeatured -> update -> delete -> verify invisible", async () => {
      const slug = createSlug();

      const product = await cmsProductAdminApi.create({
        title: "Lifecycle Product",
        slug,
        description: "Testing full lifecycle",
        features: ["lifecycle-feature"],
        isFeatured: false,
        isActive: true,
        price: {
          amountCents: 4900,
          currency: ProductCurrency.USD,
          interval: PriceInterval.MONTHLY,
        },
      });

      toCleanup.push({ table: "product", id: product.id });

      expect(product.isActive).toBe(true);
      expect(product.isFeatured).toBe(false);
      expect(product.prices).toHaveLength(1);
      expect(product.prices[0]?.amountCents).toBe(4900);

      const deactivated = await cmsProductAdminApi.toggleStatus(product.id);

      expect(deactivated.isActive).toBe(false);

      const reactivated = await cmsProductAdminApi.toggleStatus(product.id);

      expect(reactivated.isActive).toBe(true);

      const featured = await cmsProductAdminApi.toggleFeatured(product.id);

      expect(featured.isFeatured).toBe(true);

      const updated = await cmsProductAdminApi.update(product.id, {
        title: "Lifecycle Product v2",
        description: "Updated lifecycle description",
        features: ["updated-feature-1", "updated-feature-2"],
        price: {
          amountCents: 7900,
          currency: ProductCurrency.EUR,
          interval: PriceInterval.YEARLY,
        },
      });

      expect(updated.title).toBe("Lifecycle Product v2");
      expect(updated.features).toEqual(["updated-feature-1", "updated-feature-2"]);
      expect(updated.prices).toHaveLength(1);
      expect(updated.prices[0]?.amountCents).toBe(7900);
      expect(updated.prices[0]?.currency).toBe(ProductCurrency.EUR);

      await cmsProductAdminApi.delete(product.id);

      await expect(cmsProductAdminApi.getById(product.id)).rejects.toThrow(NotFoundError);

      const all = await cmsProductAdminApi.getAll();
      const found = all.find((p) => p.id === product.id);

      expect(found).toBeUndefined();
    });
  });

  describe("soft-delete blog post slug mangling", () => {
    const toCleanup: { table: string; id: string }[] = [];

    afterAll(async () => {
      await cleanup(...toCleanup);
    });

    it("delete mangles slug and sets deletedAt", async () => {
      const slug = createSlug();

      const post = await createTestBlogPost({ slug });

      toCleanup.push({ table: "marketingBlogPost", id: post.id });

      await cmsBlogAdminApi.deletePost(post.id);

      const raw = await cleanupRaw.marketingBlogPost.findUnique({ where: { id: post.id } });

      if (!raw) {
        throw new Error("expected raw record to exist after soft delete");
      }

      expect(raw.slug).toMatch(new RegExp(`^${slug}_deleted_\\d+$`));
      expect(raw.deletedAt).toBeInstanceOf(Date);
    });

    it("slug can be reused after soft-delete", async () => {
      const slug = createSlug();

      const first = await createTestBlogPost({ slug });

      toCleanup.push({ table: "marketingBlogPost", id: first.id });

      await cmsBlogAdminApi.deletePost(first.id);

      const second = await createTestBlogPost({ slug });

      toCleanup.push({ table: "marketingBlogPost", id: second.id });

      expect(second.slug).toBe(slug);

      const raw = await cleanupRaw.marketingBlogPost.findUnique({ where: { id: first.id } });

      if (!raw) {
        throw new Error("expected raw record to exist after soft delete");
      }

      expect(raw.slug).not.toBe(slug);
    });

    it("soft-deleted blog post is invisible to findMany", async () => {
      const post = await createTestBlogPost();

      toCleanup.push({ table: "marketingBlogPost", id: post.id });

      await cmsBlogAdminApi.deletePost(post.id);

      const posts = await cmsBlogAdminApi.getPosts();
      const found = posts.find((p) => p.id === post.id);

      expect(found).toBeUndefined();
    });
  });
});
