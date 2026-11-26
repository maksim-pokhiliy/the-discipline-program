import { describe, expect, it, vi } from "vitest";

import { type UpdateProductData } from "@repo/contracts/cms/product";

import { cleanupRaw } from "../../../test/helpers";

import {
  FEATURES,
  FIRST_FEATURE,
  PRICE,
  SECOND_FEATURE,
  useTestProducts,
} from "./__fixtures__/admin-products";
import { OLD_WORDS_DATE } from "./__fixtures__/translations";
import { createCmsProductAdminApi } from "./admin";

const cmsProductAdminApi = createCmsProductAdminApi({ deleteImage: vi.fn() });

const createProduct = useTestProducts();
const WORD_CHANGES: { name: string; data: UpdateProductData }[] = [
  { name: "title", data: { title: "Changed title" } },
  { name: "description", data: { description: "Changed description" } },
  {
    name: "feature text",
    data: { features: [{ ...FIRST_FEATURE, text: "Changed" }, SECOND_FEATURE] },
  },
  { name: "feature id", data: { features: [{ ...FIRST_FEATURE, id: "changed" }, SECOND_FEATURE] } },
  { name: "feature order", data: { features: [SECOND_FEATURE, FIRST_FEATURE] } },
  { name: "added feature", data: { features: [...FEATURES, { text: "Added" }] } },
  { name: "removed feature", data: { features: [FIRST_FEATURE] } },
];
const SHARED_CHANGES: { name: string; data: UpdateProductData }[] = [
  { name: "price", data: { price: PRICE } },
  { name: "slug", data: { slug: `test-clock-${crypto.randomUUID()}` } },
  { name: "visibility", data: { isActive: false } },
  { name: "featured", data: { isFeatured: true } },
  {
    name: "photo",
    data: { imageUrl: "https://synthetic.public.blob.vercel-storage.com/products/clock.jpg" },
  },
  {
    name: "same words",
    data: { title: "Test product", description: "Test description", features: FEATURES },
  },
  { name: "no changes", data: {} },
];

const ageWords = async (id: string): Promise<void> => {
  await cleanupRaw.product.update({ where: { id }, data: { wordsUpdatedAt: OLD_WORDS_DATE } });
};

const readClock = async (id: string): Promise<Date> =>
  (await cleanupRaw.product.findUniqueOrThrow({ where: { id } })).wordsUpdatedAt;

describe("update — the English words clock", () => {
  it.each(WORD_CHANGES)("moves on a $name change", async ({ data }) => {
    const product = await createProduct();

    await ageWords(product.id);
    await cmsProductAdminApi.update(product.id, data);
    expect((await readClock(product.id)).getTime()).toBeGreaterThan(OLD_WORDS_DATE.getTime());
  });

  it.each(SHARED_CHANGES)("stays on a $name change", async ({ data }) => {
    const product = await createProduct();

    await ageWords(product.id);
    await cmsProductAdminApi.update(product.id, data);
    expect(await readClock(product.id)).toEqual(OLD_WORDS_DATE);
  });

  it.each(["toggleStatus", "toggleFeatured"] as const)("stays on %s", async (toggle) => {
    const product = await createProduct();

    await ageWords(product.id);
    await cmsProductAdminApi[toggle](product.id);
    expect(await readClock(product.id)).toEqual(OLD_WORDS_DATE);
  });
});
