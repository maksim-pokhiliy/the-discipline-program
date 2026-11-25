import { type CreateProductData } from "@repo/contracts/cms/product";

import { type TxClient } from "../../../db/tx";

type PriceTerms = NonNullable<CreateProductData["price"]>;

export const buildPriceData = (price: PriceTerms): PriceTerms => ({
  amountCents: price.amountCents,
  currency: price.currency,
  periodCount: price.periodCount,
  periodUnit: price.periodUnit,
  autoRenew: price.autoRenew,
});

export const writeProductPrice = async (
  tx: TxClient,
  productId: string,
  price: PriceTerms,
): Promise<void> => {
  const existingPrice = await tx.price.findFirst({ where: { productId, isActive: true } });

  if (existingPrice) {
    await tx.price.update({ where: { id: existingPrice.id }, data: buildPriceData(price) });

    return;
  }

  await tx.price.create({ data: { productId, ...buildPriceData(price) } });
};
