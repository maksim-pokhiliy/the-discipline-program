import { DEFAULT_LOCALE } from "./locale";

const CENTS_PER_UNIT = 100;

export const centsToAmount = (cents: number): number => cents / CENTS_PER_UNIT;

export const amountToCents = (amount: number): number => Math.round(amount * CENTS_PER_UNIT);

export const formatPrice = (amountCents: number, currency: string): string => {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
  }).format(centsToAmount(amountCents));
};
