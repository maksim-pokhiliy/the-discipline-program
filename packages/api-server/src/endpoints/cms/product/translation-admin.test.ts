import { Prisma } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { TranslationState } from "@repo/contracts/cms/locale";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { cleanup, cleanupRaw } from "../../../test/helpers";
import { seedLocaleCatalog } from "../locale/__fixtures__/locale-catalog";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";

import {
  EMPTY_WORDS,
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
const { saveTranslation } = cmsProductTranslationAdminApi;

describe("cmsProductTranslationAdminApi.saveTranslation", () => {
  let snapshot: MarketingPagesState;
  const rows: { table: string; id: string }[] = [];
  const seed = async (overrides: Parameters<typeof seedTranslationProduct>[0] = {}) => {
    const product = await seedTranslationProduct(overrides);

    rows.push({ table: "product", id: product.id });

    return product;
  };

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });
  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await cleanup(...rows);
    await restoreMarketingPagesState(snapshot);
  });

  it("refuses English before reading a product", async () => {
    const reads = vi.spyOn(prisma.product, "findUnique");

    await expect(saveTranslation(translationBody("missing", { locale: "en" }))).rejects.toThrow(
      BadRequestError,
    );
    expect(reads).not.toHaveBeenCalled();
  });

  it("refuses an unknown language and a missing or soft-deleted product, writing nothing", async () => {
    const product = await seed();
    const deleted = await seed({ deletedAt: new Date() });

    await expect(saveTranslation(translationBody(product.id, { locale: "xx" }))).rejects.toThrow(
      NotFoundError,
    );
    await expect(saveTranslation(translationBody("missing"))).rejects.toThrow(NotFoundError);
    await expect(saveTranslation(translationBody(deleted.id))).rejects.toThrow(NotFoundError);
    expect(await cleanupRaw.productTranslation.count()).toBe(0);
  });

  it("pairs words with features by id after an English move and after an English removal", async () => {
    const product = await seed();

    await admin.update(product.id, { features: [SECOND_FEATURE, FIRST_FEATURE] });
    await saveTranslation(
      translationBody(product.id, { features: [FIRST_TRANSLATION, SECOND_TRANSLATION] }),
    );
    expect((await readProductDetails(product.id, "uk")).translation?.words.features).toEqual([
      SECOND_TRANSLATION,
      FIRST_TRANSLATION,
    ]);

    await admin.update(product.id, { features: [SECOND_FEATURE, THIRD_FEATURE] });
    await saveTranslation(translationBody(product.id));
    const row = await cleanupRaw.productTranslation.findFirstOrThrow({
      where: { productId: product.id },
    });

    expect(row.featureList).toEqual([SECOND_TRANSLATION, { id: THIRD_FEATURE.id, text: "" }]);
    expect(row.isActive).toBe(false);
  });

  it("saves words for a disabled language", async () => {
    const product = await seed();

    await saveTranslation(translationBody(product.id, { locale: "de" }));

    expect((await readProductDetails(product.id, "de")).translation?.state).toBe(
      TranslationState.TRANSLATED,
    );
  });

  it("is live only when every written English word has its word, and a draft otherwise", async () => {
    const product = await seed();

    await saveTranslation(translationBody(product.id, { features: [FIRST_TRANSLATION] }));
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.DRAFT,
    );

    await saveTranslation(translationBody(product.id));
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.TRANSLATED,
    );

    await saveTranslation(translationBody(product.id, { title: " \t" }));
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.DRAFT,
    );
  });

  it("stores nothing when no word is written and removes the row on a clear", async () => {
    const product = await seed();

    await saveTranslation(translationBody(product.id, EMPTY_WORDS));
    expect(await cleanupRaw.productTranslation.count()).toBe(0);

    await saveTranslation(translationBody(product.id));
    expect(await cleanupRaw.productTranslation.count()).toBe(1);
    await saveTranslation(translationBody(product.id, EMPTY_WORDS));
    expect(await cleanupRaw.productTranslation.count()).toBe(0);
  });

  it("never writes the product: words, photo, price, flags and both clocks stay", async () => {
    const product = await seed({ prices: { create: { amountCents: 9900 } } });
    const before = await cleanupRaw.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { prices: true },
    });
    const writes = vi.spyOn(prisma.product, "update");
    const body = {
      ...translationBody(product.id),
      imageUrl: null,
      slug: "another-slug",
      price: { amountCents: 0 },
      isActive: false,
      isFeatured: true,
    };

    await saveTranslation(body);

    expect(writes).not.toHaveBeenCalled();
    expect(
      await cleanupRaw.product.findUniqueOrThrow({
        where: { id: product.id },
        include: { prices: true },
      }),
    ).toEqual(before);
  });

  it("turns ENGLISH_NEWER into TRANSLATED on an unchanged save", async () => {
    const product = await seed();

    await seedProductTranslation(product.id);
    await admin.update(product.id, { title: "Changed English title" });
    const details = await readProductDetails(product.id, "uk");

    expect(details.translation?.state).toBe(TranslationState.ENGLISH_NEWER);
    await saveTranslation(translationBody(product.id, details.translation?.words));
    expect((await readProductDetails(product.id, "uk")).translation?.state).toBe(
      TranslationState.TRANSLATED,
    );
  });

  it("answers 404 Locale not found when the language disappears during the save", async () => {
    const product = await seed();

    vi.spyOn(prisma, "$transaction").mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Locale removed", {
        code: "P2003",
        clientVersion: "test",
      }),
    );

    await expect(saveTranslation(translationBody(product.id))).rejects.toMatchObject({
      statusCode: 404,
      message: "Locale not found",
    });
  });
});
