import { afterEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { cleanupRaw } from "../../../test/helpers";

import { createCmsProductAdminApi } from "./admin";
import {
  createProductInput,
  FEATURES,
  FIRST_FEATURE,
  PRICE,
  SECOND_FEATURE,
  useTestProducts,
} from "./admin-test.fixtures";

const cmsProductAdminApi = createCmsProductAdminApi({ deleteImage: vi.fn() });

const createProduct = useTestProducts();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MISSING_ID = "clxxxxxxxxxxxxxxxxxxxxxxxxx";
const REPEATED = [FIRST_FEATURE, { ...SECOND_FEATURE, id: FIRST_FEATURE.id }];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("create — features", () => {
  it("keeps given ids and mints the missing ones", async () => {
    const product = await createProduct({
      features: [FIRST_FEATURE, { text: "Missing id" }, { id: "", text: "Empty id" }],
    });

    expect(product.features[0]).toEqual(FIRST_FEATURE);
    expect(product.features[1]?.id).toMatch(UUID_PATTERN);
    expect(product.features[2]?.id).toMatch(UUID_PATTERN);
    expect(new Set(product.features.map(({ id }) => id)).size).toBe(3);
    const stored = await cleanupRaw.product.findUniqueOrThrow({ where: { id: product.id } });

    expect(stored.featureList).toEqual(product.features);
  });

  it("refuses a repeated id before any database access and creates nothing", async () => {
    const create = vi.spyOn(prisma.product, "create");
    const transaction = vi.spyOn(prisma, "$transaction");
    const input = createProductInput({ features: REPEATED, price: PRICE });

    await expect(cmsProductAdminApi.create(input)).rejects.toThrow(BadRequestError);
    expect(create).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
    expect(await cleanupRaw.product.count({ where: { slug: input.slug } })).toBe(0);
  });
});

describe("update — features", () => {
  it("keeps ids through a move and mints one for a new feature", async () => {
    const product = await createProduct();
    const updated = await cmsProductAdminApi.update(product.id, {
      features: [SECOND_FEATURE, { text: "Added" }, FIRST_FEATURE],
    });

    expect(updated.features[0]).toEqual(SECOND_FEATURE);
    expect(updated.features[1]).toEqual({ id: expect.stringMatching(UUID_PATTERN), text: "Added" });
    expect(updated.features[2]).toEqual(FIRST_FEATURE);
    expect((await cmsProductAdminApi.getById(product.id)).features).toEqual(updated.features);
  });

  it("refuses a repeated id before any database access and writes nothing, the price included", async () => {
    const product = await createProduct({ price: PRICE });
    const before = await cleanupRaw.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { prices: true },
    });
    const transaction = vi.spyOn(prisma, "$transaction");

    await expect(
      cmsProductAdminApi.update(product.id, {
        features: REPEATED,
        price: { ...PRICE, amountCents: 9000 },
      }),
    ).rejects.toThrow(BadRequestError);
    expect(transaction).not.toHaveBeenCalled();
    expect(
      await cleanupRaw.product.findUniqueOrThrow({
        where: { id: product.id },
        include: { prices: true },
      }),
    ).toEqual(before);
  });

  it("stores an empty list correctly", async () => {
    const product = await createProduct();

    expect((await cmsProductAdminApi.update(product.id, { features: [] })).features).toEqual([]);
    expect(
      (await cleanupRaw.product.findUniqueOrThrow({ where: { id: product.id } })).featureList,
    ).toEqual([]);
  });
});

describe("update — a missing or deleted product", () => {
  it("answers 404 for a missing product and writes no price", async () => {
    await expect(cmsProductAdminApi.update(MISSING_ID, { price: PRICE })).rejects.toThrow(
      NotFoundError,
    );
    expect(await cleanupRaw.price.count({ where: { productId: MISSING_ID } })).toBe(0);
  });

  it.each([false, true])(
    "answers 404 for a soft-deleted product with an existing price %s and leaves it unchanged",
    async (hasPrice) => {
      const product = await createProduct(hasPrice ? { price: PRICE } : {});

      await cmsProductAdminApi.delete(product.id);
      const before = await cleanupRaw.product.findUniqueOrThrow({
        where: { id: product.id },
        include: { prices: true },
      });

      await expect(
        cmsProductAdminApi.update(product.id, {
          title: "Refused",
          features: FEATURES,
          price: { ...PRICE, amountCents: 9900 },
        }),
      ).rejects.toThrow(NotFoundError);
      expect(
        await cleanupRaw.product.findUniqueOrThrow({
          where: { id: product.id },
          include: { prices: true },
        }),
      ).toEqual(before);
    },
  );
});
