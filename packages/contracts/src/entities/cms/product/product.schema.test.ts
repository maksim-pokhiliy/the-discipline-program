import { describe, expect, it } from "vitest";

import { PeriodUnit } from "../../../common";

import { PRODUCT_CONSTANTS, PRODUCT_PRICE_DEFAULTS, ProductCurrency } from "./product.constants";
import {
  createProductPriceSchema,
  priceSchema,
  updateProductPriceSchema,
  updateProductSchema,
} from "./product.schema";

const PRICE_ID = "clh3am8hi0000qwer1234abcd";

const AMOUNT_ONLY = { amountCents: 100 };

const LEGACY_INTERVAL = { interval: "MONTHLY" };

const ACCEPTED_PERIOD_COUNTS = [1, 365];

const REJECTED_PERIOD_COUNTS = [0, 366, 1.5];

const TRIAL_PRICE = {
  amountCents: 0,
  currency: ProductCurrency.UAH,
  periodCount: 3,
  periodUnit: PeriodUnit.DAY,
  autoRenew: false,
};

const PRICE_TERMS = Object.keys(TRIAL_PRICE);

const INVALID_PRICE_TERMS: [string, Record<string, unknown>][] = [
  ["a negative amount", { amountCents: -1 }],
  ["an amount above the maximum", { amountCents: PRODUCT_CONSTANTS.MAX_AMOUNT_CENTS + 1 }],
  ["a fractional amount", { amountCents: 99.5 }],
  ["a currency outside the enum", { currency: "GBP" }],
];

const withoutTerm = (term: string): Record<string, unknown> =>
  Object.fromEntries(Object.entries(TRIAL_PRICE).filter(([key]) => key !== term));

describe("createProductPriceSchema", () => {
  it("fills every omitted term from PRODUCT_PRICE_DEFAULTS", () => {
    expect(createProductPriceSchema.parse(AMOUNT_ONLY)).toEqual({
      ...AMOUNT_ONLY,
      ...PRODUCT_PRICE_DEFAULTS,
    });
  });

  it("keeps explicit terms over the defaults", () => {
    expect(createProductPriceSchema.parse(TRIAL_PRICE)).toEqual(TRIAL_PRICE);
  });

  it.each(ACCEPTED_PERIOD_COUNTS)("accepts a period count of %p", (periodCount) => {
    expect(createProductPriceSchema.safeParse({ ...AMOUNT_ONLY, periodCount }).success).toBe(true);
  });

  it.each(REJECTED_PERIOD_COUNTS)("rejects a period count of %p", (periodCount) => {
    expect(createProductPriceSchema.safeParse({ ...AMOUNT_ONLY, periodCount }).success).toBe(false);
  });

  it.each(INVALID_PRICE_TERMS)("rejects %s", (_label, invalidTerm) => {
    expect(createProductPriceSchema.safeParse({ ...TRIAL_PRICE, ...invalidTerm }).success).toBe(
      false,
    );
  });

  it("accepts the maximum amount", () => {
    expect(
      createProductPriceSchema.safeParse({
        ...TRIAL_PRICE,
        amountCents: PRODUCT_CONSTANTS.MAX_AMOUNT_CENTS,
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown period unit", () => {
    expect(
      createProductPriceSchema.safeParse({ ...AMOUNT_ONLY, periodUnit: "FORTNIGHT" }).success,
    ).toBe(false);
  });

  it("rejects a price that still carries the legacy interval", () => {
    expect(createProductPriceSchema.safeParse({ ...AMOUNT_ONLY, ...LEGACY_INTERVAL }).success).toBe(
      false,
    );
  });

  it("rejects a price without an amount", () => {
    expect(createProductPriceSchema.safeParse({ periodCount: 4 }).success).toBe(false);
  });
});

describe("updateProductPriceSchema", () => {
  it("keeps a complete price exactly as sent", () => {
    expect(updateProductPriceSchema.parse(TRIAL_PRICE)).toEqual(TRIAL_PRICE);
  });

  it("refuses a complete price that carries one unknown key", () => {
    expect(updateProductPriceSchema.safeParse({ ...TRIAL_PRICE, ...LEGACY_INTERVAL }).success).toBe(
      false,
    );
  });

  it.each(PRICE_TERMS)("refuses a price without %s", (term) => {
    expect(updateProductPriceSchema.safeParse(withoutTerm(term)).success).toBe(false);
  });

  it.each(INVALID_PRICE_TERMS)("rejects %s", (_label, invalidTerm) => {
    expect(updateProductPriceSchema.safeParse({ ...TRIAL_PRICE, ...invalidTerm }).success).toBe(
      false,
    );
  });
});

describe("updateProductSchema", () => {
  it("refuses a complete price that carries one unknown key", () => {
    expect(
      updateProductSchema.safeParse({ price: { ...TRIAL_PRICE, ...LEGACY_INTERVAL } }).success,
    ).toBe(false);
  });

  it("refuses a price with any term missing instead of filling it from the defaults", () => {
    expect(updateProductSchema.safeParse({ price: AMOUNT_ONLY }).success).toBe(false);
  });

  it("keeps a complete price exactly as sent", () => {
    expect(updateProductSchema.parse({ price: TRIAL_PRICE }).price).toEqual(TRIAL_PRICE);
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

  it("strips an unknown key instead of refusing the response", () => {
    const parsed = priceSchema.parse({
      id: PRICE_ID,
      isActive: true,
      ...TRIAL_PRICE,
      ...LEGACY_INTERVAL,
    });

    expect(parsed).toEqual({ id: PRICE_ID, isActive: true, ...TRIAL_PRICE });
  });

  it("rejects the legacy interval shape", () => {
    expect(
      priceSchema.safeParse({
        id: PRICE_ID,
        amountCents: 9900,
        currency: ProductCurrency.USD,
        ...LEGACY_INTERVAL,
        isActive: true,
      }).success,
    ).toBe(false);
  });
});
