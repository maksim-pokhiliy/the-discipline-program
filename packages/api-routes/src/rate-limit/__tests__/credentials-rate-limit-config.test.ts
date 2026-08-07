import { beforeEach, describe, expect, it, vi } from "vitest";

import { RATE_LIMIT_TIER } from "../rate-limit-tiers";
import type { RateLimitResult } from "../rate-limiter-port";
import { setRateLimiter } from "../rate-limiter-registry";
import { readCredentialIdentifier } from "../read-credential-identifier";
import { withAuthCredentialsRateLimit, withCredentialsRateLimit } from "../with-rate-limit";

const context = { params: Promise.resolve(undefined) };

const allow = (limit: number): RateLimitResult => ({
  allowed: true,
  limit,
  remaining: limit - 1,
  resetAt: Date.now() + 60_000,
});

const jsonRequest = (body: unknown, contentType = "application/json"): Request =>
  new Request("http://localhost/api/v1/auth/signin", {
    method: "POST",
    headers: { "content-type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("readCredentialIdentifier field selection", () => {
  it("defaults to the email field so existing callers are unchanged", async () => {
    const identifier = await readCredentialIdentifier(jsonRequest({ email: "A@B.COM" }));

    expect(identifier).toBe("a@b.com");
  });

  it("reads a named field when one is supplied", async () => {
    const identifier = await readCredentialIdentifier(
      jsonRequest({ username: "victim@tdp.local" }),
      ["username"],
    );

    expect(identifier).toBe("victim@tdp.local");
  });

  it("ignores an unrelated key an attacker adds alongside the real one", async () => {
    const identifier = await readCredentialIdentifier(
      jsonRequest({ email: "decoy-000001", username: "victim@tdp.local" }),
      ["username"],
    );

    expect(identifier).toBe("victim@tdp.local");
  });

  it("cannot be steered by a urlencoded pair smuggled inside a json body", async () => {
    const identifier = await readCredentialIdentifier(
      jsonRequest(
        { username: "victim@tdp.local", password: "x", z: "a=b&username=decoy-000001" },
        "text/plain",
      ),
      ["username"],
      "json",
    );

    expect(identifier).toBe("victim@tdp.local");
  });

  it("still honours form bodies for the session routes that post them", async () => {
    const request = new Request("http://localhost/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "email=Form%40Example.com&password=x",
    });

    expect(await readCredentialIdentifier(request)).toBe("form@example.com");
  });

  it("returns null when none of the named fields is present", async () => {
    expect(await readCredentialIdentifier(jsonRequest({ other: "x" }), ["username"])).toBeNull();
  });
});

describe("withCredentialsRateLimit bucket keys", () => {
  const checks: Array<{ key: string; limit: number; windowMs: number }> = [];

  beforeEach(() => {
    checks.length = 0;
    setRateLimiter({
      check: async (key, limit, windowMs) => {
        checks.push({ key, limit, windowMs });

        return allow(limit);
      },
    });
  });

  const handler = vi.fn(async () => new Response("ok", { status: 200 }));

  it("buckets the account limb on the value the handler authenticates with", async () => {
    const route = withCredentialsRateLimit(handler, {
      ipTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_IP,
      identifierTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_ACCOUNT,
      identifierFields: ["username"],
      identifierParse: "json",
    });

    await route(
      jsonRequest({ email: "decoy-000001", username: "victim@tdp.local", password: "x" }),
      context,
    );

    expect(checks.map((c) => c.key)).toEqual(["ip:unknown", "auth:victim@tdp.local"]);
  });

  it("applies the two tiers independently, not one tier twice", async () => {
    const route = withCredentialsRateLimit(handler, {
      ipTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_IP,
      identifierTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_ACCOUNT,
      identifierFields: ["username"],
      identifierParse: "json",
    });

    await route(jsonRequest({ username: "victim@tdp.local", password: "x" }), context);

    expect(checks[0]?.limit).toBe(RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_IP.limit);
    expect(checks[1]?.limit).toBe(RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_ACCOUNT.limit);
    expect(checks[0]?.limit).not.toBe(checks[1]?.limit);
  });

  it("keeps the legacy wrapper on one tier and the email field", async () => {
    const route = withAuthCredentialsRateLimit(handler, RATE_LIMIT_TIER.AUTH);

    await route(jsonRequest({ email: "user@example.com", password: "x" }), context);

    expect(checks.map((c) => c.key)).toEqual(["ip:unknown", "auth:user@example.com"]);
    expect(checks.every((c) => c.limit === RATE_LIMIT_TIER.AUTH.limit)).toBe(true);
  });

  it("skips the account limb when no identifier can be read", async () => {
    const route = withCredentialsRateLimit(handler, {
      ipTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_IP,
      identifierTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_ACCOUNT,
      identifierFields: ["username"],
      identifierParse: "json",
    });

    await route(jsonRequest({ password: "x" }), context);

    expect(checks.map((c) => c.key)).toEqual(["ip:unknown"]);
  });
});
