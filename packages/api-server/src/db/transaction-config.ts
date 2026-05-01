export const TX_BUDGET_DEFAULT = {
  maxWait: 5_000,
  timeout: 5_000,
} as const;

export const TX_BUDGET_LONG = {
  maxWait: 10_000,
  timeout: 30_000,
} as const;

export const TX_BUDGET_BULK = {
  maxWait: 10_000,
  timeout: 60_000,
} as const;

export const CONFIG_TRANSACTION_DEFAULTS = {
  default: TX_BUDGET_DEFAULT,
  long: TX_BUDGET_LONG,
  bulk: TX_BUDGET_BULK,
} as const;
