export enum ProductCurrency {
  USD = "USD",
  EUR = "EUR",
  UAH = "UAH",
}

export enum PriceInterval {
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
  ONE_TIME = "ONE_TIME",
}

export const PRICE_INTERVAL_LABELS: Record<PriceInterval, string> = {
  [PriceInterval.MONTHLY]: "month",
  [PriceInterval.YEARLY]: "year",
  [PriceInterval.ONE_TIME]: "one-time",
};

export const PRODUCT_DEFAULTS = {
  currency: ProductCurrency.USD,
  interval: PriceInterval.MONTHLY,
  isActive: true,
  features: [],
} as const;
