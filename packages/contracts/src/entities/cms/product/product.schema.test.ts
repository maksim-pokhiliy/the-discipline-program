import { describe, expect, it } from "vitest";

import { PeriodUnit } from "../../../common";

import { PRODUCT_PRICE_DEFAULTS, ProductCurrency } from "./product.constants";
import { createProductPriceSchema, priceSchema, updateProductSchema } from "./product.schema";

const PRICE_ID = "clh3am8hi0000qwer1234abcd";

const ACCEPTED_PERIOD_COUNTS = [1, 365];

const REJECTED_PERIOD_COUNTS = [0, 366, 1.5];

const TRIAL_PRICE = {
  amountCents: 0,
  currency: ProductCurrency.UAH,
  periodCount: 3,
  periodUnit: PeriodUnit.DAY,
  autoRenew: false,
};

describe("createProductPriceSchema", () => {
  it("fills every omitted term from PRODUCT_PRICE_DEFAULTS", () => {
    expect(createProductPriceSchema.parse({ amountCents: 100 })).toEqual({
      amountCents: 100,
      ...PRODUCT_PRICE_DEFAULTS,
    });
  });

  it("keeps explicit terms over the defaults", () => {
    expect(createProductPriceSchema.parse(TRIAL_PRICE)).toEqual(TRIAL_PRICE);
  });

  it.each(ACCEPTED_PERIOD_COUNTS)("accepts a period count of %p", (periodCount) => {
    expect(createProductPriceSchema.safeParse({ amountCents: 100, periodCount }).success).toBe(
      true,
    );
  });

  it.each(REJECTED_PERIOD_COUNTS)("rejects a period count of %p", (periodCount) => {
    expect(createProductPriceSchema.safeParse({ amountCents: 100, periodCount }).success).toBe(
      false,
    );
  });

  it("rejects an unknown period unit", () => {
    expect(
      createProductPriceSchema.safeParse({ amountCents: 100, periodUnit: "FORTNIGHT" }).success,
    ).toBe(false);
  });

  it("rejects a price that still carries the legacy interval", () => {
    expect(
      createProductPriceSchema.safeParse({ amountCents: 100, interval: "MONTHLY" }).success,
    ).toBe(false);
  });

  it("rejects a price without an amount", () => {
    expect(createProductPriceSchema.safeParse({ periodCount: 4 }).success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("keeps the nested price strict", () => {
    expect(
      updateProductSchema.safeParse({ price: { amountCents: 100, interval: "MONTHLY" } }).success,
    ).toBe(false);
  });

  it("fills the omitted terms of a present price from PRODUCT_PRICE_DEFAULTS", () => {
    expect(updateProductSchema.parse({ price: { amountCents: 100 } }).price).toEqual({
      amountCents: 100,
      ...PRODUCT_PRICE_DEFAULTS,
    });
  });

  it("leaves an absent price absent", () => {
    expect(updateProductSchema.parse({ title: "Renamed" }).price).toBeUndefined();
  });
});

describe("priceSchema", () => {
  it("accepts a price with a period and an auto-renew offer", () => {
    expect(priceSchema.safeParse({ id: PRICE_ID, isActive: true, ...TRIAL_PRICE }).success).toBe(
      true,
    );
  });

  it("rejects the legacy interval shape", () => {
    expect(
      priceSchema.safeParse({
        id: PRICE_ID,
        amountCents: 9900,
        currency: ProductCurrency.USD,
        interval: "MONTHLY",
        isActive: true,
      }).success,
    ).toBe(false);
  });
});
