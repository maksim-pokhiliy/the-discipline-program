import { type ProductTranslationWords } from "@repo/contracts/cms/product";

export const hasProductTranslationWords = (words: ProductTranslationWords): boolean =>
  [words.title, words.description, ...words.features.map(({ text }) => text)].some(
    (word) => word.trim().length > 0,
  );
