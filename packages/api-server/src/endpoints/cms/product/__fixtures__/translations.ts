import { type Prisma, type ProductTranslation } from "@prisma/client";

import { type UpdateProductTranslationBody } from "@repo/contracts/cms/product";

import { cleanupRaw, createTestProduct } from "../../../../test/helpers";

export const FIRST_FEATURE = { id: "first", text: "First English feature" };
export const SECOND_FEATURE = { id: "second", text: "Second English feature" };
export const THIRD_FEATURE = { id: "third", text: "New English feature" };
export const ENGLISH_FEATURES = [FIRST_FEATURE, SECOND_FEATURE];
export const FIRST_TRANSLATION = { id: FIRST_FEATURE.id, text: "Перша перевага" };
export const SECOND_TRANSLATION = { id: SECOND_FEATURE.id, text: "Друга перевага" };
export const TRANSLATION_WORDS = {
  title: "Назва програми",
  description: "Опис програми",
  features: [SECOND_TRANSLATION, FIRST_TRANSLATION],
};
export const EMPTY_WORDS = { title: " \t", description: "", features: [] };
export const TRANSLATION_LOCALE = "uk";
export const OLD_WORDS_DATE = new Date("2000-01-01T00:00:00.000Z");
export const TRANSLATION_DATE = new Date("2000-01-02T00:00:00.000Z");
export const PHOTO = "https://synthetic.public.blob.vercel-storage.com/products/photo.jpg";

export const seedTranslationProduct = (
  overrides: Partial<Prisma.ProductUncheckedCreateInput> = {},
): ReturnType<typeof createTestProduct> =>
  createTestProduct({
    title: "English title",
    description: "English description",
    featureList: ENGLISH_FEATURES,
    wordsUpdatedAt: OLD_WORDS_DATE,
    imageUrl: PHOTO,
    ...overrides,
  });

export const translationBody = (
  productId: string,
  overrides: Partial<UpdateProductTranslationBody> = {},
): UpdateProductTranslationBody & { productId: string } => ({
  productId,
  locale: TRANSLATION_LOCALE,
  ...TRANSLATION_WORDS,
  ...overrides,
});

export const seedProductTranslation = (
  productId: string,
  overrides: Partial<Prisma.ProductTranslationUncheckedCreateInput> = {},
): Promise<ProductTranslation> =>
  cleanupRaw.productTranslation.create({
    data: {
      productId,
      locale: TRANSLATION_LOCALE,
      title: TRANSLATION_WORDS.title,
      description: TRANSLATION_WORDS.description,
      featureList: [FIRST_TRANSLATION, SECOND_TRANSLATION],
      isActive: true,
      updatedAt: TRANSLATION_DATE,
      ...overrides,
    },
  });
