import { type Currency } from "@repo/contracts/common";
import { DEFAULT_LOCALE } from "@repo/shared";

export const getCurrencySymbol = (currency: Currency): string => {
  const currencyPart = new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency");

  return currencyPart?.value ?? currency;
};
