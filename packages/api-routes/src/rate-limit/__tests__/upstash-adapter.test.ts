import { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createUpstashRateLimiter } from "../upstash-adapter";

const limitMock = vi.fn();

vi.mock("@upstash/ratelimit", () => {
  const ratelimitConstructor = vi.fn();
  const slidingWindowSpy = vi.fn((limit: number, window: string) => ({
    kind: "sliding-window",
    limit,
    window,
  }));

  type RatelimitMockClass = typeof ratelimitConstructor & {
    slidingWindow: typeof slidingWindowSpy;
  };

  ratelimitConstructor.mockImplementation(function (this: object) {
    Object.assign(this, { limit: limitMock });
  });

  const RatelimitMock = ratelimitConstructor as unknown as RatelimitMockClass;

  RatelimitMock.slidingWindow = slidingWindowSpy;

  return { Ratelimit: RatelimitMock };
});

const RatelimitConstructor = Ratelimit as unknown as ReturnType<typeof vi.fn>;

const mockRedis = {} as unknown as Redis;

describe("createUpstashRateLimiter", () => {
  beforeEach(() => {
    limitMock.mockReset();
    RatelimitConstructor.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns allowed=true when Upstash reports success", async () => {
    limitMock.mockResolvedValueOnce({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 1000,
    });

    const limiter = createUpstashRateLimiter(mockRedis);
    const result = await limiter.check("ip:1.1.1.1", 10, 60_000);

    expect(result).toEqual({
      allowed: true,
      limit: 10,
      remaining: 9,
      resetAt: 1000,
    });
    expect(limitMock).toHaveBeenCalledWith("ip:1.1.1.1");
  });

  it("returns allowed=false when Upstash denies the request", async () => {
    limitMock.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 1234,
    });

    const limiter = createUpstashRateLimiter(mockRedis);
    const result = await limiter.check("user:42", 10, 60_000);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBe(1234);
  });

  it("caches a Ratelimit instance per (limit, windowMs) pair and reuses it", async () => {
    limitMock.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 1 });

    const limiter = createUpstashRateLimiter(mockRedis);

    await limiter.check("k1", 10, 60_000);
    await limiter.check("k2", 10, 60_000);

    expect(RatelimitConstructor).toHaveBeenCalledTimes(1);

    await limiter.check("k3", 5, 60_000);

    expect(RatelimitConstructor).toHaveBeenCalledTimes(2);
  });

  it("propagates errors thrown by the underlying Upstash client", async () => {
    limitMock.mockRejectedValueOnce(new Error("Redis connection failed"));

    const limiter = createUpstashRateLimiter(mockRedis);

    await expect(limiter.check("ip:1.1.1.1", 10, 60_000)).rejects.toThrow(
      "Redis connection failed",
    );
  });

  it("constructs the Ratelimit with the rl prefix and a slidingWindow strategy", async () => {
    limitMock.mockResolvedValueOnce({ success: true, limit: 10, remaining: 9, reset: 1 });

    const limiter = createUpstashRateLimiter(mockRedis);

    await limiter.check("k", 25, 30_000);

    expect(RatelimitConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "rl",
        redis: mockRedis,
      }),
    );
    expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(25, "30000 ms");
  });
});
