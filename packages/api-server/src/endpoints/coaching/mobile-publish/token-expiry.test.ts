import { describe, expect, it } from "vitest";

import { deriveTokenExpiry } from "./token-expiry";

const NOW = new Date("2026-06-08T00:00:00.000Z");
const MS_PER_SECOND = 1000;
const FALLBACK_TTL_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * MS_PER_SECOND;
const EXP_SECONDS = 1893456000;

const makeJwt = (payload: Record<string, unknown>): string => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${header}.${body}.signature`;
};

describe("deriveTokenExpiry", () => {
  it("reads the exp claim from a well-formed JWT", () => {
    const expiry = deriveTokenExpiry(makeJwt({ sub: "coach", exp: EXP_SECONDS }), NOW);

    expect(expiry.getTime()).toBe(EXP_SECONDS * MS_PER_SECOND);
  });

  it("falls back to now + 30 days for an opaque (non-JWT) token", () => {
    const expiry = deriveTokenExpiry("opaque-token-value", NOW);

    expect(expiry.getTime()).toBe(NOW.getTime() + FALLBACK_TTL_DAYS * MS_PER_DAY);
  });

  it("falls back to now + 30 days when the JWT payload has no exp claim", () => {
    const expiry = deriveTokenExpiry(makeJwt({ sub: "coach" }), NOW);

    expect(expiry.getTime()).toBe(NOW.getTime() + FALLBACK_TTL_DAYS * MS_PER_DAY);
  });

  it("falls back when the exp claim is not a number", () => {
    const expiry = deriveTokenExpiry(makeJwt({ sub: "coach", exp: "soon" }), NOW);

    expect(expiry.getTime()).toBe(NOW.getTime() + FALLBACK_TTL_DAYS * MS_PER_DAY);
  });

  it("falls back when the payload segment is not valid base64url JSON", () => {
    const expiry = deriveTokenExpiry("header.!!!notjson!!!.signature", NOW);

    expect(expiry.getTime()).toBe(NOW.getTime() + FALLBACK_TTL_DAYS * MS_PER_DAY);
  });
});
