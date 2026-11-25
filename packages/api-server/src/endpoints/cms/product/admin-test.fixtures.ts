import { afterAll } from "vitest";

import {
  type AdminProduct,
  type CreateProductData,
  createProductRequestSchema,
  type ProductFeature,
} from "@repo/contracts/cms/product";
import { Currency, PeriodUnit } from "@repo/contracts/common";

import { cleanup } from "../../../test/helpers";

import { cmsProductAdminApi } from "./admin";

export const FIRST_FEATURE = { id: "first", text: "First feature" };
export const SECOND_FEATURE = { id: "second", text: "Second feature" };
export const FEATURES: ProductFeature[] = [FIRST_FEATURE, SECOND_FEATURE];
export const OLD_WORDS_AT = new Date("2000-01-01T00:00:00.000Z");
export const PRICE = {
  amountCents: 1200,
  currency: Currency.UAH,
  periodCount: 4,
  periodUnit: PeriodUnit.WEEK,
  autoRenew: true,
};

export const createProductInput = (overrides: Partial<CreateProductData> = {}): CreateProductData =>
  createProductRequestSchema.parse({
    slug: `test-${crypto.randomUUID()}`,
    title: "Test product",
    description: "Test description",
    features: FEATURES,
    isFeatured: false,
    isActive: true,
    ...overrides,
  });

export const useTestProducts = (): ((
  overrides?: Partial<CreateProductData>,
) => Promise<AdminProduct>) => {
  const rows: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...rows);
  });

  return async (overrides = {}) => {
    const product = await cmsProductAdminApi.create(createProductInput(overrides));

    rows.push({ table: "product", id: product.id });

    return product;
  };
};
