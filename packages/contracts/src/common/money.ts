export const CENTS_PER_UNIT = 100;

export const centsToAmount = (cents: number): number => cents / CENTS_PER_UNIT;

export const amountToCents = (amount: number): number => Math.round(amount * CENTS_PER_UNIT);
