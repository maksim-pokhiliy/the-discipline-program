import { describe, expect, it } from "vitest";

import { PRODUCT_PRICE_DEFAULTS } from "@repo/contracts/cms/product";

import { type ProductFormData } from "./product-form-schema";
import { toProductUpdateApiData } from "./to-product-update-api-data";

const PHOTO = "https://synthetic.public.blob.vercel-storage.com/products/previous.jpg";
const REPLACEMENT = "https://synthetic.public.blob.vercel-storage.com/products/replacement.jpg";
const PRODUCT = {
  title: "Strength Mastery",
  slug: "strength-mastery",
  description: "Twelve weeks of strength work.",
  features: [{ id: "strength", text: "Strength work" }],
  isFeatured: false,
  isActive: true,
};
const FORM: ProductFormData = {
  ...PRODUCT,
  imageUrl: PHOTO,
  price: { amount: 12.5, ...PRODUCT_PRICE_DEFAULTS },
};
const EXPECTED = {
  ...PRODUCT,
  price: { amountCents: 1250, ...PRODUCT_PRICE_DEFAULTS },
};

describe("toProductUpdateApiData", () => {
  it.each([null, PHOTO])(
    "omits an untouched photo %s and converts the other fields",
    (imageUrl) => {
      const update = toProductUpdateApiData({ ...FORM, imageUrl }, false);

      expect(update).not.toHaveProperty("imageUrl");
      expect(update).toEqual(EXPECTED);
    },
  );

  it.each([null, PHOTO, REPLACEMENT])("keeps a dirty photo value %s", (imageUrl) => {
    expect(toProductUpdateApiData({ ...FORM, imageUrl }, true)).toEqual({
      ...EXPECTED,
      imageUrl,
    });
  });

  it.each([false, true])("does not mutate form values when photo dirty is %s", (isImageDirty) => {
    const data = structuredClone(FORM);

    toProductUpdateApiData(data, isImageDirty);

    expect(data).toEqual(FORM);
  });

  it("preserves an absent optional price", () => {
    expect(toProductUpdateApiData({ ...FORM, price: undefined }, false)).toEqual({
      ...PRODUCT,
      price: undefined,
    });
  });
});
