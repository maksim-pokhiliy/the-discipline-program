import { Prisma } from "@prisma/client";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { type UpdateProductTranslationBody } from "@repo/contracts/cms/product";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { TX_BUDGET_DEFAULT } from "../../../db/transaction-config";
import { type TxClient } from "../../../db/tx";
import { parseFeatureList } from "../../../mappers/cms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { assertAdminLocale } from "../locale/locale-access";

import { lockProduct } from "./product-lock";
import { composeProductTranslation } from "./product-translation";

type SaveProductTranslation = UpdateProductTranslationBody & { productId: string };

const persistTranslation = async (
  tx: TxClient,
  { productId, locale, ...words }: SaveProductTranslation,
): Promise<void> => {
  await lockProduct(tx, productId);

  const product = await findOrThrow(tx.product.findUnique({ where: { id: productId } }), "Product");
  const features = parseFeatureList(product.featureList, productId);
  const composed = composeProductTranslation({ ...product, features }, words);
  const where = { productId, locale };

  if (composed === null) {
    await tx.productTranslation.deleteMany({ where });

    return;
  }

  await tx.productTranslation.upsert({
    where: { productId_locale: where },
    create: { ...where, ...composed },
    update: composed,
  });
};

export const cmsProductTranslationAdminApi = {
  saveTranslation: async ({
    productId,
    locale,
    ...words
  }: SaveProductTranslation): Promise<void> => {
    if (locale === DEFAULT_LOCALE_CODE) {
      throw new BadRequestError(
        "The English words are saved with the product, not as a translation",
        { locale },
      );
    }

    await assertAdminLocale(locale);

    try {
      await prisma.$transaction(
        (tx) => persistTranslation(tx, { productId, locale, ...words }),
        TX_BUDGET_DEFAULT,
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new NotFoundError("Locale not found");
      }

      return handlePrismaError(error, { entity: "Product translation" });
    }
  },
};
