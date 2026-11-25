import { describe, expect, it } from "vitest";

import { TranslationState } from "../locale";

import { updateProductTranslationBodySchema } from "./product-api.schema";
import {
  adminProductDetailsSchema,
  adminProductListItemSchema,
} from "./product-translation.schema";
import { PRODUCT_CONSTANTS } from "./product.constants";

const WORDS = {
  title: "Translated title",
  description: "Translated description",
  features: [{ id: "first", text: "Translated feature" }],
};
const BODY = { locale: "uk", ...WORDS };
const PRODUCT = {
  id: "clh3am8hi0000qwer1234abcd",
  slug: "test-product",
  title: "English title",
  description: "English description",
  features: [{ id: "first", text: "English feature" }],
  imageUrl: null,
  isActive: true,
  isFeatured: false,
  prices: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("updateProductTranslationBodySchema", () => {
  it("accepts a language's words", () => {
    expect(updateProductTranslationBodySchema.parse(BODY)).toEqual(BODY);
  });

  it.each(["UK", "uk-UA", "u", ""])("refuses malformed locale %j", (locale) => {
    expect(updateProductTranslationBodySchema.safeParse({ ...BODY, locale }).success).toBe(false);
  });

  it("refuses a title over 200 and a description over 5000 characters", () => {
    expect(
      updateProductTranslationBodySchema.safeParse({
        ...BODY,
        title: "x".repeat(PRODUCT_CONSTANTS.MAX_TITLE_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(
      updateProductTranslationBodySchema.safeParse({
        ...BODY,
        description: "x".repeat(PRODUCT_CONSTANTS.MAX_DESCRIPTION_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it.each([{ features: [{ text: "Word" }] }, { features: [{ id: "", text: "Word" }] }])(
    "refuses a feature without a non-empty id: %j",
    ({ features }) => {
      expect(updateProductTranslationBodySchema.safeParse({ ...BODY, features }).success).toBe(
        false,
      );
    },
  );

  it("drops the shared values a body carries", () => {
    expect(
      updateProductTranslationBodySchema.parse({
        ...BODY,
        slug: "another-slug",
        imageUrl: null,
        isActive: false,
        isFeatured: true,
        price: { amountCents: 0 },
      }),
    ).toEqual(BODY);
  });
});

describe("adminProductDetailsSchema", () => {
  it("accepts English with no translation", () => {
    expect(
      adminProductDetailsSchema.parse({ ...PRODUCT, translation: null }).translation,
    ).toBeNull();
  });

  it.each(Object.values(TranslationState))("accepts state %s", (state) => {
    const translation = { locale: BODY.locale, state, words: WORDS };

    expect(adminProductDetailsSchema.parse({ ...PRODUCT, translation }).translation).toEqual(
      translation,
    );
  });
});

describe("adminProductListItemSchema", () => {
  it("carries the language name and state of each translation", () => {
    const translations = [{ locale: "uk", name: "Ukrainian", state: TranslationState.DRAFT }];

    expect(adminProductListItemSchema.parse({ ...PRODUCT, translations }).translations).toEqual(
      translations,
    );
  });
});
