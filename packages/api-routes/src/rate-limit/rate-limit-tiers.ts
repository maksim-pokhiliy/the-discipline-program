export const RATE_LIMIT_TIER = {
  AUTH: { limit: 5, windowMs: 60_000 },
  PUBLIC: { limit: 30, windowMs: 60_000 },
  API: { limit: 100, windowMs: 60_000 },
  MOBILE_SHIM_SIGNIN_IP: { limit: 120, windowMs: 60_000 },
  MOBILE_SHIM_SIGNIN_ACCOUNT: { limit: 10, windowMs: 60_000 },
} as const;

export type RateLimitTier = (typeof RATE_LIMIT_TIER)[keyof typeof RATE_LIMIT_TIER];

export type RateLimitTierValue = { limit: number; windowMs: number };
