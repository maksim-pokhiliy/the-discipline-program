import { describe, expect, it } from "vitest";

import { PRODUCT_PRICE_DEFAULTS } from "@repo/contracts/cms/product";
import { Currency, PeriodUnit } from "@repo/contracts/common";

import { productFormSchema } from "./product-form-schema";

const PRODUCT = {
  title: "Strength Mastery",
  slug: "strength-mastery",
  description: "Twelve weeks of strength work.",
  features: [],
  isFeatured: false,
  isActive: true,
};

describe("productFormSchema pricing", () => {
  it.each([
    {
      price: { amount: Number.NaN },
      field: "amount",
      message: "Enter the price as a number",
    },
    {
      price: { amount: 10, periodCount: Number.NaN },
      field: "periodCount",
      message: "Enter the period length as a whole number",
    },
  ])("explains an empty $field represented by NaN", ({ price, field, message }) => {
    expect(productFormSchema.safeParse({ ...PRODUCT, price })).toMatchObject({
      success: false,
      error: { issues: [{ path: ["price", field], message }] },
    });
  });

  it.each([
    {
      price: { amount: -0.01 },
      field: "amount",
      message: "Number must be greater than or equal to 0",
    },
    {
      price: { amount: 1000000 },
      field: "amount",
      message: "Number must be less than or equal to 999999.99",
    },
    {
      price: { amount: 10, periodCount: 0 },
      field: "periodCount",
      message: "Number must be greater than or equal to 1",
    },
    {
      price: { amount: 10, periodCount: 366 },
      field: "periodCount",
      message: "Number must be less than or equal to 365",
    },
    {
      price: { amount: 10, periodCount: 1.5 },
      field: "periodCount",
      message: "Expected integer, received float",
    },
  ])("preserves the $field constraint message: $message", ({ price, field, message }) => {
    expect(productFormSchema.safeParse({ ...PRODUCT, price })).toMatchObject({
      success: false,
      error: { issues: [{ path: ["price", field], message }] },
    });
  });

  it.each([0, 19.99, 999999.99])("accepts the price amount %s", (amount) => {
    expect(productFormSchema.parse({ ...PRODUCT, price: { amount } }).price?.amount).toBe(amount);
  });

  it.each([1, 365])("accepts the period boundary %s", (periodCount) => {
    expect(
      productFormSchema.parse({ ...PRODUCT, price: { amount: 10, periodCount } }).price
        ?.periodCount,
    ).toBe(periodCount);
  });

  it("fills omitted price terms from the existing contract defaults", () => {
    expect(productFormSchema.parse({ ...PRODUCT, price: { amount: 10 } }).price).toEqual({
      amount: 10,
      ...PRODUCT_PRICE_DEFAULTS,
    });
  });

  it("preserves explicit price terms instead of replacing them with defaults", () => {
    const price = {
      amount: 0,
      currency: Currency.USD,
      periodCount: 1,
      periodUnit: PeriodUnit.MONTH,
      autoRenew: false,
    };

    expect(productFormSchema.parse({ ...PRODUCT, price }).price).toEqual(price);
  });

  it("keeps an absent price optional", () => {
    expect(productFormSchema.parse(PRODUCT).price).toBeUndefined();
  });

  it("keeps the amount required when a price is present", () => {
    expect(productFormSchema.safeParse({ ...PRODUCT, price: {} })).toMatchObject({
      success: false,
      error: { issues: [{ path: ["price", "amount"], message: "Required" }] },
    });
  });
});
