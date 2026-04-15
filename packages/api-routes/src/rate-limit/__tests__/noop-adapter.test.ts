import { describe, expect, it } from "vitest";

import { createNoopRateLimiter } from "../noop-adapter";

describe("createNoopRateLimiter", () => {
  const limiter = createNoopRateLimiter();

  it("returns allowed: true", async () => {
    const result = await limiter.check("ip:127.0.0.1", 10, 60_000);

    expect(result.allowed).toBe(true);
  });

  it("returns the passed limit", async () => {
    const result = await limiter.check("ip:127.0.0.1", 42, 60_000);

    expect(result.limit).toBe(42);
  });

  it("returns remaining as limit - 1", async () => {
    const result = await limiter.check("ip:127.0.0.1", 10, 60_000);

    expect(result.remaining).toBe(9);
  });

  it("returns resetAt in the future based on windowMs", async () => {
    const before = Date.now();
    const result = await limiter.check("ip:127.0.0.1", 10, 30_000);

    expect(result.resetAt).toBeGreaterThanOrEqual(before + 30_000);
  });
});
