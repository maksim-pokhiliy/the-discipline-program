import { type Currency as PrismaCurrency } from "@prisma/client";

import { Currency } from "@repo/contracts/common";

export const CURRENCY_MAP: Record<PrismaCurrency, Currency> = {
  USD: Currency.USD,
  EUR: Currency.EUR,
  UAH: Currency.UAH,
};
