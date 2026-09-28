import { type Price, type Product, ProductCurrency } from "@repo/contracts/cms/product";
import { PeriodUnit } from "@repo/contracts/common";

export const makePrice = (overrides: Partial<Price> = {}): Price => ({
  id: "clz00000000000000000prc1",
  amountCents: 9900,
  currency: ProductCurrency.USD,
  periodCount: 1,
  periodUnit: PeriodUnit.MONTH,
  autoRenew: true,
  isActive: true,
  ...overrides,
});

export const makeProduct = (prices: Price[]): Product => ({
  id: "clz00000000000000000prd1",
  slug: "strength-mastery",
  title: "Strength Mastery",
  description: "Twelve weeks of barbell strength work.",
  features: [],
  isFeatured: false,
  isActive: true,
  prices,
  createdAt: new Date("2026-06-16T09:00:00.000Z"),
  updatedAt: new Date("2026-06-16T09:00:00.000Z"),
});
