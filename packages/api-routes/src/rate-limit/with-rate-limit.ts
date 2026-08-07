import { TooManyRequestsError } from "@repo/errors";

import { getMonitoring } from "../monitoring";
import type { AuthenticatedHandler, RouteHandler } from "../types";

import { getClientIp } from "./ip-utils";
import type { RateLimitTierValue } from "./rate-limit-tiers";
import type { RateLimiterPort, RateLimitResult } from "./rate-limiter-port";
import { getRateLimiter } from "./rate-limiter-registry";
import {
  type CredentialIdentifierParse,
  readCredentialIdentifier,
} from "./read-credential-identifier";

const setRateLimitHeaders = (response: Response, result: RateLimitResult): void => {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetAt));
};

const denyIfExceeded = (result: RateLimitResult): void => {
  if (!result.allowed) {
    throw new TooManyRequestsError("Too many requests", {
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    });
  }
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

const DEFAULT_IDENTIFIER_KEY_PREFIX = "auth:";

export type CredentialsRateLimitConfig = {
  ipTier: RateLimitTierValue;
  identifierTier: RateLimitTierValue;
  identifierFields: readonly string[];
  identifierParse?: CredentialIdentifierParse;
  identifierKeyPrefix?: string;
};

const reportRateLimiterFault = (error: unknown): void => {
  getMonitoring()?.captureException(error, {
    tags: { component: "rate-limiter" },
    level: "warning",
  });
};

const enforceIdentifierLimit = async (
  request: Request,
  limiter: RateLimiterPort,
  config: CredentialsRateLimitConfig,
): Promise<void> => {
  const identifier = await readCredentialIdentifier(
    request,
    config.identifierFields,
    config.identifierParse,
  );

  if (!identifier) {
    return;
  }

  const prefix = config.identifierKeyPrefix ?? DEFAULT_IDENTIFIER_KEY_PREFIX;
  const identifierResult = await limiter.check(
    `${prefix}${identifier}`,
    config.identifierTier.limit,
    config.identifierTier.windowMs,
  );

  denyIfExceeded(identifierResult);
};

export const withCredentialsRateLimit =
  (handler: RouteHandler, config: CredentialsRateLimitConfig): RouteHandler =>
  async (request, context) => {
    const limiter = getRateLimiter();

    if (!limiter) {
      return handler(request, context);
    }

    let ipResult: RateLimitResult;

    try {
      const ip = getClientIp(request);

      ipResult = await limiter.check(`ip:${ip}`, config.ipTier.limit, config.ipTier.windowMs);
    } catch (error) {
      reportRateLimiterFault(error);

      return handler(request, context);
    }

    denyIfExceeded(ipResult);

    try {
      await enforceIdentifierLimit(request, limiter, config);
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        throw error;
      }

      reportRateLimiterFault(error);
    }

    const response = await handler(request, context);

    setRateLimitHeaders(response, ipResult);

    return response;
  };

const EMAIL_IDENTIFIER_FIELDS = ["email"] as const;

export const withAuthCredentialsRateLimit = (
  handler: RouteHandler,
  tier: RateLimitTierValue,
): RouteHandler =>
  withCredentialsRateLimit(handler, {
    ipTier: tier,
    identifierTier: tier,
    identifierFields: EMAIL_IDENTIFIER_FIELDS,
  });
