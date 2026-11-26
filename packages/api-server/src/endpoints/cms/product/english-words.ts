import { type ProductFeature } from "@repo/contracts/cms/product";

export type EnglishWords = {
  title: string;
  description: string;
  features: readonly ProductFeature[];
};

export const haveEnglishWordsChanged = (before: EnglishWords, after: EnglishWords): boolean =>
  before.title !== after.title ||
  before.description !== after.description ||
  before.features.length !== after.features.length ||
  before.features.some((feature, index) => {
    const next = after.features[index];

    return feature.id !== next?.id || feature.text !== next?.text;
  });
