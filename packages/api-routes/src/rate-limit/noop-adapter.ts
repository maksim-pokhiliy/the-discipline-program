import type { RateLimiterPort } from "./rate-limiter-port";

export const createNoopRateLimiter = (): RateLimiterPort => ({
  check: async (_key, limit, windowMs) => ({
    allowed: true,
    limit,
    remaining: limit - 1,
    resetAt: Date.now() + windowMs,
  }),
});
