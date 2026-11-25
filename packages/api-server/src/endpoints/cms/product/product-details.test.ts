import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { TranslationState } from "@repo/contracts/cms/locale";
import { type UpdateProductData } from "@repo/contracts/cms/product";
import { Currency, PeriodUnit } from "@repo/contracts/common";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { cleanup } from "../../../test/helpers";
import { seedLocaleCatalog } from "../locale/__fixtures__/locale-catalog";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";

import {
  ENGLISH_FEATURES,
  FIRST_FEATURE,
  FIRST_TRANSLATION,
  SECOND_FEATURE,
  SECOND_TRANSLATION,
  THIRD_FEATURE,
  seedProductTranslation,
  seedTranslationProduct,
  translationBody,
} from "./__fixtures__/translations";
import { createCmsProductAdminApi } from "./admin";
import { readProductDetails } from "./product-details";
import { cmsProductTranslationAdminApi } from "./translation-admin";

const admin = createCmsProductAdminApi({ deleteImage: vi.fn() });
const WORD_CHANGES: { name: string; data: UpdateProductData }[] = [
  { name: "title", data: { title: "Changed title" } },
  { name: "description", data: { description: "Changed description" } },
  {
    name: "feature text",
    data: { features: [{ ...FIRST_FEATURE, text: "Changed feature" }, SECOND_FEATURE] },
  },
  { name: "feature id", data: { features: [{ ...FIRST_FEATURE, id: "new-id" }, SECOND_FEATURE] } },
  { name: "order", data: { features: [SECOND_FEATURE, FIRST_FEATURE] } },
  { name: "count", data: { features: [FIRST_FEATURE] } },
];
const SHARED_CHANGES: { name: string; data: UpdateProductData }[] = [
  {
    name: "price",
    data: {
      price: {
        amountCents: 1000,
        currency: Currency.USD,
        periodCount: 1,
        periodUnit: PeriodUnit.MONTH,
        autoRenew: true,
      },
    },
  },
  { name: "slug", data: { slug: `test-translated-${crypto.randomUUID()}` } },
  { name: "visibility", data: { isActive: false } },
  { name: "featured", data: { isFeatured: false } },
  { name: "photo", data: { imageUrl: null } },
];

describe("readProductDetails", () => {
  let snapshot: MarketingPagesState;
  const rows: { table: string; id: string }[] = [];
  const seed = async (overrides: Parameters<typeof seedTranslationProduct>[0] = {}) => {
    const product = await seedTranslationProduct(overrides);

    rows.push({ table: "product", id: product.id });

    return product;
  };

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await seedLocaleCatalog();
  });
  afterAll(async () => {
    await cleanup(...rows);
    await restoreMarketingPagesState(snapshot);
  });

  it("reads English with no translation using one product query", async () => {
    const product = await seed();

    await seedProductTranslation(product.id);
    const query = vi.spyOn(prisma.product, "findUnique");

    try {
      const details = await admin.getById(product.id);

      expect(details).toMatchObject({
        title: product.title,
        features: ENGLISH_FEATURES,
        translation: null,
      });
      expect(query).toHaveBeenCalledTimes(1);
    } finally {
      query.mockRestore();
    }
  });

  it("reads a language without a row as NOT_TRANSLATED with empty words lined up with English", async () => {
    const product = await seed();

    expect((await readProductDetails(product.id, "uk")).translation).toEqual({
      locale: "uk",
      state: TranslationState.NOT_TRANSLATED,
      words: {
        title: "",
        description: "",
        features: ENGLISH_FEATURES.map(({ id }) => ({ id, text: "" })),
      },
    });
  });

  it("reads a draft as DRAFT with its words lined up with the current English", async () => {
    const product = await seed({ featureList: [SECOND_FEATURE, THIRD_FEATURE, FIRST_FEATURE] });

    await seedProductTranslation(product.id, { isActive: false });
    expect((await readProductDetails(product.id, "uk")).translation).toMatchObject({
      state: TranslationState.DRAFT,
      words: {
        features: [SECOND_TRANSLATION, { id: THIRD_FEATURE.id, text: "" }, FIRST_TRANSLATION],
      },
    });
  });

  it("reads a disabled language and answers 404 for an unknown one before reading a product", async () => {
    const product = await seed();

    expect((await readProductDetails(product.id, "de")).translation?.state).toBe(
      TranslationState.NOT_TRANSLATED,
    );
    const query = vi.spyOn(prisma.product, "findUnique");

    try {
      await expect(readProductDetails(product.id, "xx")).rejects.toThrow(NotFoundError);
      expect(query).not.toHaveBeenCalled();
    } finally {
      query.mockRestore();
    }
  });

  it("answers 404 for a missing or soft-deleted product", async () => {
    const product = await seed({ deletedAt: new Date() });

    await expect(readProductDetails("missing", "uk")).rejects.toThrow(NotFoundError);
    await expect(readProductDetails(product.id, "uk")).rejects.toThrow(NotFoundError);
  });

  it.each(WORD_CHANGES)("reads ENGLISH_NEWER after a $name change", async ({ data }) => {
    const product = await seed();

    await seedProductTranslation(product.id);
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.TRANSLATED,
    );
    await admin.update(product.id, data);
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.ENGLISH_NEWER,
    );
  });

  it.each(SHARED_CHANGES)("reads TRANSLATED after a $name change", async ({ data }) => {
    const product = await seed();

    await seedProductTranslation(product.id);
    await admin.update(product.id, data);
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.TRANSLATED,
    );
  });

  it("reads TRANSLATED after a toggle", async () => {
    const product = await seed();

    await seedProductTranslation(product.id);
    await admin.toggleStatus(product.id);
    await admin.toggleFeatured(product.id);
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.TRANSLATED,
    );
  });

  it("reads TRANSLATED again after an unchanged save", async () => {
    const product = await seed();

    await seedProductTranslation(product.id);
    await admin.update(product.id, { features: [SECOND_FEATURE, FIRST_FEATURE] });
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.ENGLISH_NEWER,
    );
    await cmsProductTranslationAdminApi.saveTranslation(translationBody(product.id));
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.TRANSLATED,
    );
  });
});
