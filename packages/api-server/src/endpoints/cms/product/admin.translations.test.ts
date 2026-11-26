import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { TranslationState } from "@repo/contracts/cms/locale";
import {
  getProductsPageDataResponseSchema,
  getProductsResponseSchema,
} from "@repo/contracts/cms/product";

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
  PHOTO,
  seedProductTranslation,
  seedTranslationProduct,
} from "./__fixtures__/translations";
import { createCmsProductAdminApi } from "./admin";

const admin = createCmsProductAdminApi({ deleteImage: vi.fn() });
const CREATED_FIRST = new Date("2000-01-01T00:00:00.000Z");
const CREATED_SECOND = new Date("2000-01-02T00:00:00.000Z");

describe("cmsProductAdminApi — list and page data", () => {
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

  it("lists products newest first with the photo and the feature rows", async () => {
    const first = await seedTranslationProduct({ createdAt: CREATED_FIRST });
    const second = await seedTranslationProduct({ createdAt: CREATED_SECOND });

    rows.push({ table: "product", id: first.id }, { table: "product", id: second.id });

    const ownIds = new Set([first.id, second.id]);
    const products = getProductsResponseSchema
      .parse(await admin.getAll())
      .filter(({ id }) => ownIds.has(id));

    expect(products.map(({ id }) => id)).toEqual([second.id, first.id]);
    expect(products[0]).toMatchObject({
      imageUrl: PHOTO,
      features: ENGLISH_FEATURES,
      translations: [],
    });
  });

  it("lists each product's translations in catalog order with name and state", async () => {
    const product = await seedTranslationProduct();

    rows.push({ table: "product", id: product.id });
    await seedProductTranslation(product.id, { locale: "fr", isActive: false });
    await seedProductTranslation(product.id, { locale: "de" });
    await seedProductTranslation(product.id);
    const data = getProductsPageDataResponseSchema.parse(await admin.getPageData());

    expect(data.products.find(({ id }) => id === product.id)?.translations).toEqual([
      { locale: "uk", name: "Українська", state: TranslationState.TRANSLATED },
      { locale: "de", name: "Deutsch", state: TranslationState.TRANSLATED },
      { locale: "fr", name: "Français", state: TranslationState.DRAFT },
    ]);
  });
});
