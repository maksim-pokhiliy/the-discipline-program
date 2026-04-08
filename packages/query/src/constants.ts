export const STALE_TIMES = {
  NONE: 0,
  THIRTY_SECONDS: 30 * 1000,
  MEDIUM: 1000 * 60 * 5,
} as const;

export const GC_TIMES = {
  DEFAULT: 10 * 60 * 1000,
} as const;
