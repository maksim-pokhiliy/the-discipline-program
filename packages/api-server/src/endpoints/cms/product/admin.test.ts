import { afterAll, describe, expect, it } from "vitest";
import { type z } from "zod";

import {
  createProductRequestSchema,
  PRODUCT_PRICE_DEFAULTS,
  updateProductRequestSchema,
} from "@repo/contracts/cms/product";
import { Currency, PeriodUnit } from "@repo/contracts/common";
import { ConflictError, NotFoundError } from "@repo/errors";

import { mapToPrice } from "../../../mappers/cms";
import { cleanup, cleanupRaw, createTestProduct } from "../../../test/helpers";

import { cmsProductAdminApi } from "./admin";

const createSlug = () => `test-${crypto.randomUUID().slice(0, 12)}`;

const createInput = (overrides: Partial<z.input<typeof createProductRequestSchema>> = {}) =>
  createProductRequestSchema.parse({
    title: "Test Product",
    slug: createSlug(),
    description: "Test product description",
    features: ["feature-1", "feature-2"],
    isFeatured: false,
    isActive: true,
    ...overrides,
  });

const updateInput = (input: z.input<typeof updateProductRequestSchema>) =>
  updateProductRequestSchema.parse(input);

const TRIAL_PRICE = {
  amountCents: 0,
  currency: Currency.UAH,
  periodCount: 3,
  periodUnit: PeriodUnit.DAY,
  autoRenew: false,
};

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
      const input = createInput();
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

    it("creates a product with a price and its period", async () => {
      const product = await cmsProductAdminApi.create(
        createInput({
          price: {
            amountCents: 9900,
            currency: Currency.USD,
            periodCount: 1,
            periodUnit: PeriodUnit.MONTH,
            autoRenew: true,
          },
        }),
      );

      toCleanup.push({ table: "product", id: product.id });

      expect(product.prices).toHaveLength(1);
      expect(product.prices[0]).toMatchObject({
        amountCents: 9900,
        currency: Currency.USD,
        periodCount: 1,
        periodUnit: PeriodUnit.MONTH,
        autoRenew: true,
        isActive: true,
      });
    });

    it("uses the contract price defaults", async () => {
      const product = await cmsProductAdminApi.create(
        createInput({ price: { amountCents: 5000 } }),
      );

      toCleanup.push({ table: "product", id: product.id });

      expect(product.prices).toHaveLength(1);
      expect(product.prices[0]).toMatchObject({ amountCents: 5000, ...PRODUCT_PRICE_DEFAULTS });
    });

    it("throws ConflictError on duplicate slug", async () => {
      const slug = createSlug();

      const first = await cmsProductAdminApi.create(createInput({ slug }));

      toCleanup.push({ table: "product", id: first.id });

      await expect(cmsProductAdminApi.create(createInput({ slug }))).rejects.toThrow(ConflictError);
    });
  });

  describe("price column defaults", () => {
    it("equal PRODUCT_PRICE_DEFAULTS for a row the database fills itself", async () => {
      const product = await createTestProduct();
      const priceId = crypto.randomUUID();

      toCleanup.push({ table: "product", id: product.id });

      await cleanupRaw.$executeRaw`INSERT INTO "app_prices" ("id", "productId", "amountCents") VALUES (${priceId}, ${product.id}, 100)`;

      const row = await cleanupRaw.price.findUniqueOrThrow({ where: { id: priceId } });

      expect(mapToPrice(row)).toMatchObject(PRODUCT_PRICE_DEFAULTS);
    });
  });

  describe("update", () => {
    it("updates product fields", async () => {
      const product = await cmsProductAdminApi.create(createInput());

      toCleanup.push({ table: "product", id: product.id });

      const updated = await cmsProductAdminApi.update(
        product.id,
        updateInput({
          title: "Updated Title",
          description: "Updated description",
          features: ["new-feature"],
        }),
      );

      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated description");
      expect(updated.features).toEqual(["new-feature"]);
      expect(updated.id).toBe(product.id);
    });

    it("adds a price to a product without one", async () => {
      const product = await cmsProductAdminApi.create(createInput());

      toCleanup.push({ table: "product", id: product.id });

      expect(product.prices).toHaveLength(0);

      const updated = await cmsProductAdminApi.update(
        product.id,
        updateInput({
          price: {
            amountCents: 1999,
            currency: Currency.EUR,
            periodCount: 1,
            periodUnit: PeriodUnit.YEAR,
            autoRenew: true,
          },
        }),
      );

      expect(updated.prices).toHaveLength(1);
      expect(updated.prices[0]).toMatchObject({
        amountCents: 1999,
        currency: Currency.EUR,
        periodCount: 1,
        periodUnit: PeriodUnit.YEAR,
        autoRenew: true,
      });
    });

    it("updates the active price in place", async () => {
      const product = await cmsProductAdminApi.create(
        createInput({ price: { amountCents: 1000 } }),
      );

      toCleanup.push({ table: "product", id: product.id });

      const originalPriceId = product.prices[0]?.id;

      expect(originalPriceId).toBeDefined();

      const updated = await cmsProductAdminApi.update(
        product.id,
        updateInput({ price: TRIAL_PRICE }),
      );

      expect(updated.prices).toHaveLength(1);
      expect(updated.prices[0]?.id).toBe(originalPriceId);
      expect(updated.prices[0]).toMatchObject(TRIAL_PRICE);
      expect(await cleanupRaw.price.count({ where: { productId: product.id } })).toBe(1);
    });

    it("throws NotFoundError for non-existent id", async () => {
      await expect(
        cmsProductAdminApi.update("clxxxxxxxxxxxxxxxxxxxxxxxxx", updateInput({ title: "Nope" })),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("soft-deletes a product", async () => {
      const product = await cmsProductAdminApi.create(createInput());

      toCleanup.push({ table: "product", id: product.id });

      await cmsProductAdminApi.delete(product.id);

      await expect(cmsProductAdminApi.getById(product.id)).rejects.toThrow(NotFoundError);
    });

    it("deleted product is invisible in getAll", async () => {
      const product = await cmsProductAdminApi.create(createInput());

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

      const first = await cmsProductAdminApi.create(createInput({ slug }));

      toCleanup.push({ table: "product", id: first.id });

      await cmsProductAdminApi.delete(first.id);

      const second = await cmsProductAdminApi.create(createInput({ slug }));

      toCleanup.push({ table: "product", id: second.id });

      expect(second.slug).toBe(slug);
    });
  });

  describe("toggleStatus", () => {
    it("flips isActive from true to false", async () => {
      const product = await cmsProductAdminApi.create(createInput({ isActive: true }));

      toCleanup.push({ table: "product", id: product.id });

      const toggled = await cmsProductAdminApi.toggleStatus(product.id);

      expect(toggled.isActive).toBe(false);
    });

    it("flips isActive from false to true", async () => {
      const product = await cmsProductAdminApi.create(createInput({ isActive: false }));

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
      const product = await cmsProductAdminApi.create(createInput({ isFeatured: false }));

      toCleanup.push({ table: "product", id: product.id });

      const toggled = await cmsProductAdminApi.toggleFeatured(product.id);

      expect(toggled.isFeatured).toBe(true);
    });

    it("toggle OFF sets isFeatured to false", async () => {
      const product = await cmsProductAdminApi.create(createInput({ isFeatured: true }));

      toCleanup.push({ table: "product", id: product.id });

      const toggled = await cmsProductAdminApi.toggleFeatured(product.id);

      expect(toggled.isFeatured).toBe(false);
    });

    it("toggle ON unfeatures all other products", async () => {
      const existing = await cmsProductAdminApi.create(createInput({ isFeatured: true }));

      toCleanup.push({ table: "product", id: existing.id });

      const target = await cmsProductAdminApi.create(createInput({ isFeatured: false }));

      toCleanup.push({ table: "product", id: target.id });

      const toggled = await cmsProductAdminApi.toggleFeatured(target.id);

      expect(toggled.isFeatured).toBe(true);

      const existingAfter = await cmsProductAdminApi.getById(existing.id);

      expect(existingAfter.isFeatured).toBe(false);
    });

    it("toggle OFF keeps others unchanged", async () => {
      const other = await cmsProductAdminApi.create(createInput({ isFeatured: false }));

      toCleanup.push({ table: "product", id: other.id });

      const target = await cmsProductAdminApi.create(createInput({ isFeatured: true }));

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
