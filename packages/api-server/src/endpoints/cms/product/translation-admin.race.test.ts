import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { cleanup, cleanupRaw } from "../../../test/helpers";
import { seedLocaleCatalog } from "../locale/__fixtures__/locale-catalog";
import { openTransaction, waitForLockWaiter } from "../locale/__fixtures__/lock-race";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";

import {
  SECOND_FEATURE,
  SECOND_TRANSLATION,
  THIRD_FEATURE,
  seedTranslationProduct,
  translationBody,
} from "./__fixtures__/translations";
import { createCmsProductAdminApi } from "./admin";
import { readProductDetails } from "./product-details";
import { lockProduct } from "./product-lock";
import { cmsProductTranslationAdminApi } from "./translation-admin";

const OTHER_PHOTO = "https://synthetic.public.blob.vercel-storage.com/products/other.jpg";
const NEXT_PHOTO = "https://synthetic.public.blob.vercel-storage.com/products/next.jpg";

describe("saveTranslation — the product lock", () => {
  let snapshot: MarketingPagesState;
  const rows: { table: string; id: string }[] = [];

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await seedLocaleCatalog();
  });
  afterAll(async () => {
    await cleanup(...rows);
    await restoreMarketingPagesState(snapshot);
  });

  it("a save parked behind an English update composes from the committed English", async () => {
    const product = await seedTranslationProduct();

    rows.push({ table: "product", id: product.id });

    const writer = await openTransaction(async (tx) => {
      await lockProduct(tx, product.id);
      await tx.product.update({
        where: { id: product.id },
        data: { featureList: [SECOND_FEATURE, THIRD_FEATURE] },
      });
    });
    const save = cmsProductTranslationAdminApi.saveTranslation(translationBody(product.id));

    try {
      await waitForLockWaiter("pg_advisory_xact_lock");
    } finally {
      await writer.commit();
      await save;
    }

    expect((await readProductDetails(product.id, "uk")).translation?.words.features).toEqual([
      SECOND_TRANSLATION,
      { id: THIRD_FEATURE.id, text: "" },
    ]);
    const stored = await cleanupRaw.productTranslation.findFirstOrThrow({
      where: { productId: product.id },
    });

    expect(stored.featureList).toEqual([SECOND_TRANSLATION, { id: THIRD_FEATURE.id, text: "" }]);
    expect(stored.isActive).toBe(false);
  });

  it("an English update takes the same product lock before reading or writing", async () => {
    const product = await seedTranslationProduct();

    rows.push({ table: "product", id: product.id });

    const writer = await openTransaction(async (tx) => {
      await lockProduct(tx, product.id);
      await tx.product.update({ where: { id: product.id }, data: { imageUrl: OTHER_PHOTO } });
    });
    const deleteImage = vi.fn();
    const admin = createCmsProductAdminApi({ deleteImage });
    const update = admin.update(product.id, {
      title: "English after the lock",
      imageUrl: NEXT_PHOTO,
    });

    try {
      await waitForLockWaiter("pg_advisory_xact_lock");
    } finally {
      await writer.commit();
      await update;
    }

    expect((await readProductDetails(product.id)).title).toBe("English after the lock");
    expect(deleteImage).toHaveBeenCalledExactlyOnceWith(OTHER_PHOTO);
  });
});
