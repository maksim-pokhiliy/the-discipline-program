import { Redis } from "@upstash/redis";

import { createNoopRateLimiter } from "./noop-adapter";
import type { RateLimiterPort } from "./rate-limiter-port";
import { createUpstashRateLimiter } from "./upstash-adapter";

let rateLimiter: RateLimiterPort | undefined;

export const setRateLimiter = (port: RateLimiterPort): void => {
  rateLimiter = port;
};

export const getRateLimiter = (): RateLimiterPort | undefined => {
  return rateLimiter;
};

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const defaultRateLimiter = hasUpstash
  ? createUpstashRateLimiter(Redis.fromEnv())
  : createNoopRateLimiter();
