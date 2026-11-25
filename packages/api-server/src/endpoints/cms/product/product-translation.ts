import { TranslationState } from "@repo/contracts/cms/locale";
import { type ProductFeature, type ProductTranslationWords } from "@repo/contracts/cms/product";

import { isWordWritten } from "../pages/section-translation";

import { type EnglishWords } from "./english-words";

export type ComposedTranslation = {
  title: string;
  description: string;
  featureList: ProductFeature[];
  isActive: boolean;
};

type StoredTranslationWords = {
  title: string;
  description: string;
  featureList: readonly ProductFeature[];
};

type TranslationRowForState = { isActive: boolean; updatedAt: Date };

const wordById = (features: readonly ProductFeature[], id: string): string =>
  features.find((feature) => feature.id === id)?.text ?? "";

export const composeProductTranslation = (
  english: EnglishWords,
  words: ProductTranslationWords,
): ComposedTranslation | null => {
  const featureList = english.features.map(({ id }) => ({
    id,
    text: wordById(words.features, id),
  }));

  if (
    ![words.title, words.description, ...featureList.map(({ text }) => text)].some(isWordWritten)
  ) {
    return null;
  }

  const isActive =
    isWordWritten(words.title) &&
    isWordWritten(words.description) &&
    english.features.every(
      (feature) =>
        !isWordWritten(feature.text) || isWordWritten(wordById(words.features, feature.id)),
    );

  return { title: words.title, description: words.description, featureList, isActive };
};

export const alignTranslationWords = (
  english: EnglishWords,
  row: StoredTranslationWords | null,
): ProductTranslationWords => ({
  title: row?.title ?? "",
  description: row?.description ?? "",
  features: english.features.map(({ id }) => ({ id, text: wordById(row?.featureList ?? [], id) })),
});

export const productTranslationState = (
  row: TranslationRowForState | null,
  wordsUpdatedAt: Date,
): TranslationState => {
  if (row === null) {
    return TranslationState.NOT_TRANSLATED;
  }

  if (!row.isActive) {
    return TranslationState.DRAFT;
  }

  return wordsUpdatedAt.getTime() > row.updatedAt.getTime()
    ? TranslationState.ENGLISH_NEWER
    : TranslationState.TRANSLATED;
};
