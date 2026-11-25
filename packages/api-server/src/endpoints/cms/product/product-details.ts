import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import { type AdminProductDetails } from "@repo/contracts/cms/product";

import { prisma } from "../../../db/client";
import { mapToAdminProduct, parseFeatureList } from "../../../mappers/cms";
import { findOrThrow } from "../../../utils";
import { assertAdminLocale } from "../locale/locale-access";

import { alignTranslationWords, productTranslationState } from "./product-translation";

export const readProductDetails = async (
  id: string,
  locale: LocaleCode = DEFAULT_LOCALE_CODE,
): Promise<AdminProductDetails> => {
  await assertAdminLocale(locale);

  const product = await findOrThrow(
    prisma.product.findUnique({
      where: { id },
      include: {
        prices: { where: { isActive: true } },
        translations: { where: { locale } },
      },
    }),
    "Product",
  );
  const english = mapToAdminProduct(product);
  const row = product.translations[0] ?? null;

  return {
    ...english,
    translation:
      locale === DEFAULT_LOCALE_CODE
        ? null
        : {
            locale,
            state: productTranslationState(row, product.wordsUpdatedAt),
            words: alignTranslationWords(
              english,
              row && { ...row, featureList: parseFeatureList(row.featureList, id) },
            ),
          },
  };
};
