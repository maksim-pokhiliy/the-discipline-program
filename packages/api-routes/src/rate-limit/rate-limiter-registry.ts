import { Redis } from "@upstash/redis";

import { logger } from "@repo/shared";

import { getDiRegistrySlot } from "../di-global";

import { createNoopRateLimiter } from "./noop-adapter";
import type { RateLimiterPort } from "./rate-limiter-port";
import { createUpstashRateLimiter } from "./upstash-adapter";

const RATE_LIMIT_TIMEOUT_MS = 2_000;

let hasWarnedMissing = false;

export const setRateLimiter = (port: RateLimiterPort): void => {
  getDiRegistrySlot().rateLimiter = port;
};

export const getRateLimiter = (): RateLimiterPort | undefined => {
  const rateLimiter = getDiRegistrySlot().rateLimiter;

  if (!rateLimiter && !hasWarnedMissing && process.env.NODE_ENV === "production") {
    hasWarnedMissing = true;
    logger.error("rate_limit.unavailable", { reason: "registry_not_bootstrapped" });
  }

  return rateLimiter;
};

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const defaultRateLimiter = hasUpstash
  ? createUpstashRateLimiter(
      Redis.fromEnv({ signal: () => AbortSignal.timeout(RATE_LIMIT_TIMEOUT_MS) }),
    )
  : createNoopRateLimiter();
