import { TooManyRequestsError } from "@repo/errors";

import { getMonitoring } from "../monitoring";
import type { AuthenticatedHandler, RouteHandler } from "../types";

import { getClientIp } from "./ip-utils";
import type { RateLimitTierValue } from "./rate-limit-tiers";
import type { RateLimitResult } from "./rate-limiter-port";
import { getRateLimiter } from "./rate-limiter-registry";

const setRateLimitHeaders = (response: Response, result: RateLimitResult): void => {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetAt));
};

export const withRateLimit =
  (handler: RouteHandler, tier: RateLimitTierValue): RouteHandler =>
  async (request, context) => {
    const limiter = getRateLimiter();

    if (!limiter) {
      return handler(request, context);
    }

    let result: RateLimitResult;

    try {
      const ip = getClientIp(request);

      result = await limiter.check(`ip:${ip}`, tier.limit, tier.windowMs);
    } catch (error) {
      getMonitoring()?.captureException(error, {
        tags: { component: "rate-limiter" },
        level: "warning",
      });

      return handler(request, context);
    }

    if (!result.allowed) {
      throw new TooManyRequestsError("Too many requests", {
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
    }

    const response = await handler(request, context);

    setRateLimitHeaders(response, result);

    return response;
  };

export const withAuthRateLimit =
  (handler: AuthenticatedHandler, tier: RateLimitTierValue): AuthenticatedHandler =>
  async (request, context, userId) => {
    const limiter = getRateLimiter();

    if (!limiter) {
      return handler(request, context, userId);
    }

    let result: RateLimitResult;

    try {
      result = await limiter.check(`user:${userId}`, tier.limit, tier.windowMs);
    } catch (error) {
      getMonitoring()?.captureException(error, {
        tags: { component: "rate-limiter" },
        level: "warning",
      });

      return handler(request, context, userId);
    }

    if (!result.allowed) {
      throw new TooManyRequestsError("Too many requests", {
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
    }

    const response = await handler(request, context, userId);

    setRateLimitHeaders(response, result);

    return response;
  };
