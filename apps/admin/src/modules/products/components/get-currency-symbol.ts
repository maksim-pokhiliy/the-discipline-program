import { type ProductCurrency } from "@repo/contracts/cms/product";
import { DEFAULT_LOCALE } from "@repo/shared";

export const getCurrencySymbol = (currency: ProductCurrency): string => {
  const currencyPart = new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency");

  return currencyPart?.value ?? currency;
};
