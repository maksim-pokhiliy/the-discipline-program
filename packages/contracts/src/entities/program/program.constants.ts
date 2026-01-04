export const PROGRAM_CONSTANTS = {
  DEFAULT_CURRENCY: "USD",
  MIN_PRICE: 0,
  MAX_FEATURES: 20,
  SLUG_PATTERN: /^[a-z0-9-]+$/,
  DEFAULT_SORT_ORDER: 0,
} as const;

export const PROGRAM_CURRENCIES = ["USD", "EUR", "UAH"] as const;

export const PROGRAM_DEFAULTS = {
  currency: "USD",
  isActive: true,
  sortOrder: 0,
  features: [],
} as const;
