import { describe, expect, it } from "vitest";

import { Currency, PeriodUnit } from "../../../common";

import { PRODUCT_CONSTANTS, PRODUCT_PRICE_DEFAULTS } from "./product.constants";
import {
  adminProductSchema,
  createProductSchema,
  productFeatureWriteSchema,
  productSchema,
  createProductPriceSchema,
  priceSchema,
  updateProductPriceSchema,
  updateProductSchema,
} from "./product.schema";

const PRICE_ID = "clh3am8hi0000qwer1234abcd";
const PRODUCT_ID = "clh3am8hi0001qwer1234abcd";

const AMOUNT_ONLY = { amountCents: 100 };

const LEGACY_INTERVAL = { interval: "MONTHLY" };

const ACCEPTED_PERIOD_COUNTS = [1, 365];

const REJECTED_PERIOD_COUNTS = [0, 366, 1.5];

const TRIAL_PRICE = {
  amountCents: 0,
  currency: Currency.UAH,
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

  it.each(ACCEPTED_PERIOD_COUNTS)("accepts a period count of %s", (periodCount) => {
    expect(createProductPriceSchema.safeParse({ ...AMOUNT_ONLY, periodCount }).success).toBe(true);
  });

  it.each(REJECTED_PERIOD_COUNTS)("rejects a period count of %s", (periodCount) => {
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
        currency: Currency.USD,
        ...LEGACY_INTERVAL,
        isActive: true,
      }).success,
    ).toBe(false);
  });
});

const FEATURE = { id: "feature-one", text: "Coached sessions" };
const PRODUCT_INPUT = {
  title: "Test product",
  slug: "test-product",
  description: "Description",
  features: [FEATURE],
  isFeatured: false,
  isActive: true,
};
const PRODUCT_RESPONSE = {
  ...PRODUCT_INPUT,
  id: PRODUCT_ID,
  prices: [],
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("productFeatureWriteSchema", () => {
  it("accepts a feature without an id", () => {
    expect(productFeatureWriteSchema.parse({ text: FEATURE.text })).toEqual({ text: FEATURE.text });
  });

  it("keeps a given id", () => {
    expect(productFeatureWriteSchema.parse(FEATURE)).toEqual(FEATURE);
  });

  it.each(["", " ", "\t\n"])("refuses unwritten text %j with the field message", (text) => {
    const result = productFeatureWriteSchema.safeParse({ text });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Write the feature or remove it");
    }
  });

  it("keeps feature text unbounded", () => {
    expect(
      productFeatureWriteSchema.parse({
        text: "x".repeat(PRODUCT_CONSTANTS.MAX_DESCRIPTION_LENGTH + 1),
      }).text.length,
    ).toBeGreaterThan(PRODUCT_CONSTANTS.MAX_DESCRIPTION_LENGTH);
  });
});

describe("createProductSchema — features", () => {
  it("refuses features sent as plain strings", () => {
    expect(
      createProductSchema.safeParse({ ...PRODUCT_INPUT, features: [FEATURE.text] }).success,
    ).toBe(false);
  });

  it("accepts an empty list from an old tab", () => {
    expect(createProductSchema.parse({ ...PRODUCT_INPUT, features: [] }).features).toEqual([]);
  });
});

describe("product feature read contracts", () => {
  it("keeps public features as strings", () => {
    expect(productSchema.parse({ ...PRODUCT_RESPONSE, features: [FEATURE.text] }).features).toEqual(
      [FEATURE.text],
    );
    expect(productSchema.safeParse(PRODUCT_RESPONSE).success).toBe(false);
  });

  it("requires a non-empty id on every admin feature", () => {
    expect(adminProductSchema.parse(PRODUCT_RESPONSE).features).toEqual([FEATURE]);
    expect(
      adminProductSchema.safeParse({ ...PRODUCT_RESPONSE, features: [{ text: FEATURE.text }] })
        .success,
    ).toBe(false);
    expect(
      adminProductSchema.safeParse({ ...PRODUCT_RESPONSE, features: [{ ...FEATURE, id: "" }] })
        .success,
    ).toBe(false);
  });

  it("leaves features absent when not supplied for update", () => {
    expect(updateProductSchema.parse({ title: "Renamed" })).not.toHaveProperty("features");
  });
});

const PHOTO = "https://synthetic.public.blob.vercel-storage.com/products/photo.jpg";

describe("product photo contracts", () => {
  it.each([PHOTO, null, undefined])(
    "accepts an uploaded Blob photo, null or omitted: %s",
    (imageUrl) => {
      expect(createProductSchema.safeParse({ ...PRODUCT_INPUT, imageUrl }).success).toBe(true);
    },
  );

  it.each([
    "https://example.com/photo.jpg",
    "https://synthetic.public.blob.vercel-storage.com.example.com/photo.jpg",
    "",
  ])("refuses a photo URL that is not an uploaded Blob: %s", (imageUrl) => {
    expect(createProductSchema.safeParse({ ...PRODUCT_INPUT, imageUrl }).success).toBe(false);
    expect(updateProductSchema.safeParse({ imageUrl }).success).toBe(false);
  });

  it("leaves absent features and the photo out of an update", () => {
    expect(updateProductSchema.parse({ title: "Renamed" })).toStrictEqual({ title: "Renamed" });
  });

  it("accepts explicit null to remove the photo", () => {
    expect(updateProductSchema.parse({ imageUrl: null })).toEqual({ imageUrl: null });
  });

  it("requires a nullable public photo and keeps feature strings", () => {
    const response = { ...PRODUCT_RESPONSE, features: [FEATURE.text] };
    const withoutPhoto = Object.fromEntries(
      Object.entries(response).filter(([key]) => key !== "imageUrl"),
    );

    expect(productSchema.parse(response).features).toEqual([FEATURE.text]);
    expect(productSchema.parse(response).imageUrl).toBeNull();
    expect(productSchema.parse({ ...response, imageUrl: PHOTO }).imageUrl).toBe(PHOTO);
    expect(productSchema.safeParse(withoutPhoto).success).toBe(false);
  });
});
