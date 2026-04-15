import { afterAll, describe, expect, it } from "vitest";

import { PriceInterval, ProductCurrency } from "@repo/contracts/cms/product";
import { ConflictError, NotFoundError } from "@repo/errors";

import { cleanup, createTestProduct } from "../../../test/helpers";

import { cmsProductAdminApi } from "./admin";

const createSlug = () => `test-${crypto.randomUUID().slice(0, 12)}`;

const baseProductData = (overrides: Record<string, unknown> = {}) => ({
  title: "Test Product",
  slug: createSlug(),
  description: "Test product description",
  features: ["feature-1", "feature-2"],
  isFeatured: false,
  isActive: true,
  ...overrides,
});

describe("cmsProductAdminApi", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("getAll", () => {
    it("returns an array of products", async () => {
      const product = await createTestProduct();

      toCleanup.push({ table: "product", id: product.id });

      const all = await cmsProductAdminApi.getAll();

      expect(Array.isArray(all)).toBe(true);

      const found = all.find((p) => p.id === product.id);

      expect(found).toBeDefined();
      expect(found?.title).toBe(product.title);
    });
  });

  describe("getById", () => {
    it("returns a mapped product", async () => {
      const product = await createTestProduct({ features: ["a", "b"] });

      toCleanup.push({ table: "product", id: product.id });

      const result = await cmsProductAdminApi.getById(product.id);

      expect(result.id).toBe(product.id);
      expect(result.slug).toBe(product.slug);
      expect(result.title).toBe(product.title);
      expect(result.features).toEqual(["a", "b"]);
      expect(result.prices).toEqual([]);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("throws NotFoundError for non-existent id", async () => {
      await expect(cmsProductAdminApi.getById("clxxxxxxxxxxxxxxxxxxxxxxxxx")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getPageData", () => {
    it("returns shape with products array", async () => {
      const product = await createTestProduct();

      toCleanup.push({ table: "product", id: product.id });

      const data = await cmsProductAdminApi.getPageData();

      expect(data).toHaveProperty("products");
      expect(Array.isArray(data.products)).toBe(true);

      const found = data.products.find((p) => p.id === product.id);

      expect(found).toBeDefined();
    });
  });

  describe("create", () => {
    it("creates a product without price", async () => {
      const input = baseProductData();
      const product = await cmsProductAdminApi.create(input);

      toCleanup.push({ table: "product", id: product.id });

      expect(product.title).toBe("Test Product");
      expect(product.slug).toBe(input.slug);
      expect(product.description).toBe("Test product description");
      expect(product.features).toEqual(["feature-1", "feature-2"]);
      expect(product.isActive).toBe(true);
      expect(product.isFeatured).toBe(false);
      expect(product.prices).toEqual([]);
    });

    it("creates a product with price", async () => {
      const product = await cmsProductAdminApi.create(
        baseProductData({
          price: {
            amountCents: 9900,
            currency: ProductCurrency.USD,
            interval: PriceInterval.MONTHLY,
          },
        }),
      );

      toCleanup.push({ table: "product", id: product.id });

      expect(product.prices).toHaveLength(1);
      expect(product.prices[0]?.amountCents).toBe(9900);
      expect(product.prices[0]?.currency).toBe(ProductCurrency.USD);
      expect(product.prices[0]?.interval).toBe(PriceInterval.MONTHLY);
      expect(product.prices[0]?.isActive).toBe(true);
    });

    it("uses default currency and interval when not specified", async () => {
      const product = await cmsProductAdminApi.create(
        baseProductData({
          price: { amountCents: 5000 },
        }),
      );

      toCleanup.push({ table: "product", id: product.id });

      expect(product.prices).toHaveLength(1);
      expect(product.prices[0]?.currency).toBe(ProductCurrency.USD);
      expect(product.prices[0]?.interval).toBe(PriceInterval.MONTHLY);
    });

    it("throws ConflictError on duplicate slug", async () => {
      const slug = createSlug();

      const first = await cmsProductAdminApi.create(baseProductData({ slug }));

      toCleanup.push({ table: "product", id: first.id });

      await expect(cmsProductAdminApi.create(baseProductData({ slug }))).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("update", () => {
    it("updates product fields", async () => {
      const product = await cmsProductAdminApi.create(baseProductData());

      toCleanup.push({ table: "product", id: product.id });

      const updated = await cmsProductAdminApi.update(product.id, {
        title: "Updated Title",
        description: "Updated description",
        features: ["new-feature"],
      });

      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated description");
      expect(updated.features).toEqual(["new-feature"]);
      expect(updated.id).toBe(product.id);
    });

    it("adds price to product without price", async () => {
      const product = await cmsProductAdminApi.create(baseProductData());

      toCleanup.push({ table: "product", id: product.id });

      expect(product.prices).toHaveLength(0);

      const updated = await cmsProductAdminApi.update(product.id, {
        price: {
          amountCents: 1999,
          currency: ProductCurrency.EUR,
          interval: PriceInterval.YEARLY,
        },
      });

      expect(updated.prices).toHaveLength(1);
      expect(updated.prices[0]?.amountCents).toBe(1999);
      expect(updated.prices[0]?.currency).toBe(ProductCurrency.EUR);
      expect(updated.prices[0]?.interval).toBe(PriceInterval.YEARLY);
    });

    it("updates existing price", async () => {
      const product = await cmsProductAdminApi.create(
        baseProductData({
          price: { amountCents: 1000 },
        }),
      );

      toCleanup.push({ table: "product", id: product.id });

      const updated = await cmsProductAdminApi.update(product.id, {
        price: {
          amountCents: 2500,
          currency: ProductCurrency.UAH,
          interval: PriceInterval.ONE_TIME,
        },
      });

      expect(updated.prices).toHaveLength(1);
      expect(updated.prices[0]?.amountCents).toBe(2500);
      expect(updated.prices[0]?.currency).toBe(ProductCurrency.UAH);
      expect(updated.prices[0]?.interval).toBe(PriceInterval.ONE_TIME);
    });

    it("throws NotFoundError for non-existent id", async () => {
      await expect(
        cmsProductAdminApi.update("clxxxxxxxxxxxxxxxxxxxxxxxxx", { title: "Nope" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("soft-deletes a product", async () => {
      const product = await cmsProductAdminApi.create(baseProductData());

      toCleanup.push({ table: "product", id: product.id });

      await cmsProductAdminApi.delete(product.id);

      await expect(cmsProductAdminApi.getById(product.id)).rejects.toThrow(NotFoundError);
    });

    it("deleted product is invisible in getAll", async () => {
      const product = await cmsProductAdminApi.create(baseProductData());

      toCleanup.push({ table: "product", id: product.id });

      await cmsProductAdminApi.delete(product.id);

      const all = await cmsProductAdminApi.getAll();
      const found = all.find((p) => p.id === product.id);

      expect(found).toBeUndefined();
    });

    it("throws NotFoundError for non-existent id", async () => {
      await expect(cmsProductAdminApi.delete("clxxxxxxxxxxxxxxxxxxxxxxxxx")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("slug is freed after soft-delete for reuse", async () => {
      const slug = createSlug();

      const first = await cmsProductAdminApi.create(baseProductData({ slug }));

      toCleanup.push({ table: "product", id: first.id });

      await cmsProductAdminApi.delete(first.id);

      const second = await cmsProductAdminApi.create(baseProductData({ slug }));

      toCleanup.push({ table: "product", id: second.id });

      expect(second.slug).toBe(slug);
    });
  });

  describe("toggleStatus", () => {
    it("flips isActive from true to false", async () => {
      const product = await cmsProductAdminApi.create(baseProductData({ isActive: true }));

      toCleanup.push({ table: "product", id: product.id });

      const toggled = await cmsProductAdminApi.toggleStatus(product.id);

      expect(toggled.isActive).toBe(false);
    });

    it("flips isActive from false to true", async () => {
      const product = await cmsProductAdminApi.create(baseProductData({ isActive: false }));

      toCleanup.push({ table: "product", id: product.id });

      const toggled = await cmsProductAdminApi.toggleStatus(product.id);

      expect(toggled.isActive).toBe(true);
    });

    it("throws NotFoundError for non-existent id", async () => {
      await expect(cmsProductAdminApi.toggleStatus("clxxxxxxxxxxxxxxxxxxxxxxxxx")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("toggleFeatured", () => {
    it("toggle ON sets isFeatured to true", async () => {
      const product = await cmsProductAdminApi.create(baseProductData({ isFeatured: false }));

      toCleanup.push({ table: "product", id: product.id });

      const toggled = await cmsProductAdminApi.toggleFeatured(product.id);

      expect(toggled.isFeatured).toBe(true);
    });

    it("toggle OFF sets isFeatured to false", async () => {
      const product = await cmsProductAdminApi.create(baseProductData({ isFeatured: true }));

      toCleanup.push({ table: "product", id: product.id });

      const toggled = await cmsProductAdminApi.toggleFeatured(product.id);

      expect(toggled.isFeatured).toBe(false);
    });

    it("toggle ON unfeatures all other products", async () => {
      const existing = await cmsProductAdminApi.create(baseProductData({ isFeatured: true }));

      toCleanup.push({ table: "product", id: existing.id });

      const target = await cmsProductAdminApi.create(baseProductData({ isFeatured: false }));

      toCleanup.push({ table: "product", id: target.id });

      const toggled = await cmsProductAdminApi.toggleFeatured(target.id);

      expect(toggled.isFeatured).toBe(true);

      const existingAfter = await cmsProductAdminApi.getById(existing.id);

      expect(existingAfter.isFeatured).toBe(false);
    });

    it("toggle OFF keeps others unchanged", async () => {
      const other = await cmsProductAdminApi.create(baseProductData({ isFeatured: false }));

      toCleanup.push({ table: "product", id: other.id });

      const target = await cmsProductAdminApi.create(baseProductData({ isFeatured: true }));

      toCleanup.push({ table: "product", id: target.id });

      const toggled = await cmsProductAdminApi.toggleFeatured(target.id);

      expect(toggled.isFeatured).toBe(false);

      const otherAfter = await cmsProductAdminApi.getById(other.id);

      expect(otherAfter.isFeatured).toBe(false);
    });

    it("throws NotFoundError for non-existent id", async () => {
      await expect(
        cmsProductAdminApi.toggleFeatured("clxxxxxxxxxxxxxxxxxxxxxxxxx"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
