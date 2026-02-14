export const PRODUCT_CURRENCIES = ["USD", "EUR", "UAH"] as const;

export const PRICE_INTERVALS = ["MONTHLY", "YEARLY", "ONE_TIME"] as const;

export const PRICE_INTERVAL_LABELS: Record<(typeof PRICE_INTERVALS)[number], string> = {
  MONTHLY: "month",
  YEARLY: "year",
  ONE_TIME: "one-time",
};

export const PRODUCT_DEFAULTS = {
  currency: "USD",
  interval: "MONTHLY",
  isActive: true,
  features: [],
} as const;
