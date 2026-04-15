import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooManyRequestsError } from "@repo/errors";

import type { MonitoringPort } from "../../monitoring";
import type { AuthenticatedHandler, RouteContext, RouteHandler } from "../../types";
import type { RateLimiterPort, RateLimitResult } from "../rate-limiter-port";

vi.mock("../index", () => ({
  getRateLimiter: vi.fn(() => undefined),
}));

vi.mock("../../monitoring", () => ({
  getMonitoring: vi.fn(() => undefined),
}));

const { getRateLimiter } = await import("../index");
const { getMonitoring } = await import("../../monitoring");
const { withRateLimit, withAuthRateLimit } = await import("../with-rate-limit");

const mockGetRateLimiter = vi.mocked(getRateLimiter);
const mockGetMonitoring = vi.mocked(getMonitoring);

const dummyContext: RouteContext = { params: Promise.resolve({}) };

const createMockHandler = (): RouteHandler => {
  return vi.fn(async () => NextResponse.json({ ok: true }));
};

const createMockAuthHandler = (): AuthenticatedHandler => {
  return vi.fn(async () => NextResponse.json({ ok: true }));
};

const createMockLimiter = (result: RateLimitResult): RateLimiterPort => ({
  check: vi.fn(async () => result),
});

const tier = { limit: 10, windowMs: 60_000 } as const;

describe("withRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls handler and sets rate limit headers when allowed", async () => {
    const result: RateLimitResult = {
      allowed: true,
      limit: 10,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    };
    const limiter = createMockLimiter(result);

    mockGetRateLimiter.mockReturnValue(limiter);

    const handler = createMockHandler();
    const wrapped = withRateLimit(handler, tier);
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const response = await wrapped(request, dummyContext);

    expect(handler).toHaveBeenCalledOnce();
    expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("9");
    expect(response.headers.get("X-RateLimit-Reset")).toBe(String(result.resetAt));
  });

  it("throws TooManyRequestsError with retryAfter when denied", async () => {
    const resetAt = Date.now() + 30_000;
    const limiter = createMockLimiter({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt,
    });

    mockGetRateLimiter.mockReturnValue(limiter);

    const handler = createMockHandler();
    const wrapped = withRateLimit(handler, tier);
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    await expect(wrapped(request, dummyContext)).rejects.toThrow(TooManyRequestsError);
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes through without headers when no limiter is set", async () => {
    mockGetRateLimiter.mockReturnValue(undefined);

    const handler = createMockHandler();
    const wrapped = withRateLimit(handler, tier);
    const request = new Request("https://example.com");

    const response = await wrapped(request, dummyContext);

    expect(handler).toHaveBeenCalledOnce();
    expect(response.headers.has("X-RateLimit-Limit")).toBe(false);
  });

  it("passes through and logs warning when limiter.check throws", async () => {
    const captureException = vi.fn(() => "event-id");

    mockGetMonitoring.mockReturnValue({ captureException } as unknown as MonitoringPort);
    const limiter: RateLimiterPort = {
      check: vi.fn(async () => {
        throw new Error("Redis connection failed");
      }),
    };

    mockGetRateLimiter.mockReturnValue(limiter);

    const handler = createMockHandler();
    const wrapped = withRateLimit(handler, tier);
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const response = await wrapped(request, dummyContext);

    expect(handler).toHaveBeenCalledOnce();
    expect(response.headers.has("X-RateLimit-Limit")).toBe(false);
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { component: "rate-limiter" },
      level: "warning",
    });
  });

  it("uses ip: prefix as the rate limit key", async () => {
    const limiter = createMockLimiter({
      allowed: true,
      limit: 10,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    });

    mockGetRateLimiter.mockReturnValue(limiter);

    const handler = createMockHandler();
    const wrapped = withRateLimit(handler, tier);
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });

    await wrapped(request, dummyContext);

    expect(limiter.check).toHaveBeenCalledWith("ip:192.168.1.1", 10, 60_000);
  });
});

describe("withAuthRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls handler and sets rate limit headers when allowed", async () => {
    const result: RateLimitResult = {
      allowed: true,
      limit: 100,
      remaining: 99,
      resetAt: Date.now() + 60_000,
    };
    const limiter = createMockLimiter(result);

    mockGetRateLimiter.mockReturnValue(limiter);

    const handler = createMockAuthHandler();
    const wrapped = withAuthRateLimit(handler, tier);
    const request = new Request("https://example.com");

    const response = await wrapped(request, dummyContext, "user-123");

    expect(handler).toHaveBeenCalledWith(request, dummyContext, "user-123");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("uses user: prefix as the rate limit key", async () => {
    const limiter = createMockLimiter({
      allowed: true,
      limit: 10,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    });

    mockGetRateLimiter.mockReturnValue(limiter);

    const handler = createMockAuthHandler();
    const wrapped = withAuthRateLimit(handler, tier);
    const request = new Request("https://example.com");

    await wrapped(request, dummyContext, "user-456");

    expect(limiter.check).toHaveBeenCalledWith("user:user-456", 10, 60_000);
  });

  it("throws TooManyRequestsError when denied", async () => {
    const limiter = createMockLimiter({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });

    mockGetRateLimiter.mockReturnValue(limiter);

    const handler = createMockAuthHandler();
    const wrapped = withAuthRateLimit(handler, tier);
    const request = new Request("https://example.com");

    await expect(wrapped(request, dummyContext, "user-123")).rejects.toThrow(TooManyRequestsError);
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes through when no limiter is set", async () => {
    mockGetRateLimiter.mockReturnValue(undefined);

    const handler = createMockAuthHandler();
    const wrapped = withAuthRateLimit(handler, tier);
    const request = new Request("https://example.com");

    const response = await wrapped(request, dummyContext, "user-123");

    expect(handler).toHaveBeenCalledOnce();
    expect(response.headers.has("X-RateLimit-Limit")).toBe(false);
  });
});
