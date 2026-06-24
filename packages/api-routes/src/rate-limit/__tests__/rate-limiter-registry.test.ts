import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetDiRegistrySlotForTests } from "../../di-global";
import type { RateLimitResult, RateLimiterPort } from "../rate-limiter-port";

const buildPort = (label: string): RateLimiterPort => ({
  check: async (): Promise<RateLimitResult> => ({
    allowed: true,
    limit: 10,
    remaining: 9,
    resetAt: Date.now() + 60_000,
    ...({ tag: label } as Partial<RateLimitResult>),
  }),
});

describe("rate-limiter-registry", () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    vi.resetModules();
    resetDiRegistrySlotForTests();
  });

  afterEach(() => {
    resetDiRegistrySlotForTests();

    if (originalUrl === undefined) {
      delete process.env.UPSTASH_REDIS_REST_URL;
    } else {
      process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    }

    if (originalToken === undefined) {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    } else {
      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    }

    vi.restoreAllMocks();
  });

  it("returns undefined from getRateLimiter before any limiter is registered", async () => {
    const { getRateLimiter } = await import("../rate-limiter-registry");

    expect(getRateLimiter()).toBeUndefined();
  });

  it("setRateLimiter installs the limiter and getRateLimiter returns it", async () => {
    const { setRateLimiter, getRateLimiter } = await import("../rate-limiter-registry");
    const port = buildPort("test");

    setRateLimiter(port);

    expect(getRateLimiter()).toBe(port);
  });

  it("setRateLimiter overwrites the previously registered limiter", async () => {
    const { setRateLimiter, getRateLimiter } = await import("../rate-limiter-registry");
    const first = buildPort("first");
    const second = buildPort("second");

    setRateLimiter(first);
    setRateLimiter(second);

    expect(getRateLimiter()).toBe(second);
  });

  it("uses the noop adapter as defaultRateLimiter when Upstash env vars are unset", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { defaultRateLimiter } = await import("../rate-limiter-registry");
    const result = await defaultRateLimiter.check("any", 10, 60_000);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
  });

  it("uses an Upstash-backed limiter as defaultRateLimiter when env vars are set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example-upstash.local";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    const upstashAdapterSpy = vi.fn(() => ({
      check: vi.fn(async () => ({ allowed: true, limit: 10, remaining: 9, resetAt: 1 })),
    }));

    vi.doMock("../upstash-adapter", () => ({
      createUpstashRateLimiter: upstashAdapterSpy,
    }));

    vi.doMock("@upstash/redis", () => ({
      Redis: { fromEnv: vi.fn(() => ({ kind: "redis-stub" })) },
    }));

    const { defaultRateLimiter } = await import("../rate-limiter-registry");

    expect(upstashAdapterSpy).toHaveBeenCalledOnce();
    expect(defaultRateLimiter).toBeDefined();
  });
});
