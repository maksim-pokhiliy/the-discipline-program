import { type AdminProduct } from "@repo/contracts/cms/product";
import { formatPeriod } from "@repo/contracts/common";
import { DEFAULT_LOCALE, formatPrice } from "@repo/shared";

export const getDisplayPrice = (product: Pick<AdminProduct, "prices">): string => {
  const activePrice = product.prices.find((price) => price.isActive);

  if (!activePrice) {
    return "No price";
  }

  return `${formatPrice(activePrice.amountCents, activePrice.currency)}/${formatPeriod(activePrice, DEFAULT_LOCALE)}`;
};
