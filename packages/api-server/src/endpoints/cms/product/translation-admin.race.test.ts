import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { cleanup } from "../../../test/helpers";
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
  });

  it("an English update takes the same product lock before reading or writing", async () => {
    const product = await seedTranslationProduct();

    rows.push({ table: "product", id: product.id });

    const writer = await openTransaction((tx) => lockProduct(tx, product.id));
    const admin = createCmsProductAdminApi({ deleteImage: vi.fn() });
    const update = admin.update(product.id, { title: "English after the lock" });

    try {
      await waitForLockWaiter("pg_advisory_xact_lock");
    } finally {
      await writer.commit();
      await update;
    }

    expect((await readProductDetails(product.id)).title).toBe("English after the lock");
  });
});
