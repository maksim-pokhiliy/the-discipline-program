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
    const [header, payload, signature] = token.split(".");
    const flipped = signature?.startsWith("A") ? "B" : "A";
    const tampered = `${header}.${payload}.${flipped}${signature?.slice(1)}`;

    expect(tampered).not.toBe(token);
    expect(await verifyMobileShimToken(tampered)).toBeNull();
  });

  it("rejects a token whose payload was edited after signing", async () => {
    const token = await signMobileShimToken(CLAIMS);
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ ...CLAIMS, legacyUserId: 9999 })).toString(
      "base64url",
    );

    expect(await verifyMobileShimToken(`${header}.${forgedPayload}.${signature}`)).toBeNull();
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
