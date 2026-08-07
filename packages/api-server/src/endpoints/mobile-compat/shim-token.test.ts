import { afterEach, describe, expect, it, vi } from "vitest";

import { signMobileShimToken, verifyMobileShimToken } from "./shim-token";

const CLAIMS = { sub: "cuid-1", legacyUserId: 1001, tokenVersion: 0 };

const MS_PER_DAY = 86_400_000;

describe("mobile shim token", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("round-trips its own claims", async () => {
    const token = await signMobileShimToken(CLAIMS);

    expect(await verifyMobileShimToken(token)).toMatchObject(CLAIMS);
  });

  it("rejects a token with a tampered signature", async () => {
    const token = await signMobileShimToken(CLAIMS);
    const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;

    expect(await verifyMobileShimToken(tampered)).toBeNull();
  });

  it("rejects a structurally invalid token", async () => {
    expect(await verifyMobileShimToken("not-a-jwt")).toBeNull();
  });

  it("rejects an empty token", async () => {
    expect(await verifyMobileShimToken("")).toBeNull();
  });

  it("rejects a token after it expires", async () => {
    const token = await signMobileShimToken(CLAIMS);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 31 * MS_PER_DAY));

    expect(await verifyMobileShimToken(token)).toBeNull();
  });

  it("still accepts a token inside its lifetime", async () => {
    const token = await signMobileShimToken(CLAIMS);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 29 * MS_PER_DAY));

    expect(await verifyMobileShimToken(token)).toMatchObject(CLAIMS);
  });

  it("carries the legacy id and token version so the resolver can check them", async () => {
    const token = await signMobileShimToken({ sub: "u", legacyUserId: 42, tokenVersion: 7 });
    const claims = await verifyMobileShimToken(token);

    expect(claims?.legacyUserId).toBe(42);
    expect(claims?.tokenVersion).toBe(7);
  });
});
