export const STALE_TIMES = {
  NONE: 0,
  SHORT: 1000 * 60,
  MEDIUM: 1000 * 60 * 5,
  LONG: 1000 * 60 * 60,
  INFINITE: Infinity,
} as const;
