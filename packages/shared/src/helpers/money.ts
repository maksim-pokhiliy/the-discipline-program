import { centsToAmount } from "@repo/contracts/common/money";

import { DEFAULT_LOCALE } from "./locale";

export const formatPrice = (amountCents: number, currency: string): string => {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centsToAmount(amountCents));
};
