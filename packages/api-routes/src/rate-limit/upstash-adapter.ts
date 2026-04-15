import { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";

import type { RateLimiterPort } from "./rate-limiter-port";

export const createUpstashRateLimiter = (redis: Redis): RateLimiterPort => {
  const limiters = new Map<string, Ratelimit>();

  const getLimiter = (limit: number, windowMs: number): Ratelimit => {
    const cacheKey = `${limit}:${windowMs}`;
    let limiter = limiters.get(cacheKey);

    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        prefix: "rl",
      });
      limiters.set(cacheKey, limiter);
    }

    return limiter;
  };

  return {
    check: async (key, limit, windowMs) => {
      const limiter = getLimiter(limit, windowMs);
      const result = await limiter.limit(key);

      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    },
  };
};
