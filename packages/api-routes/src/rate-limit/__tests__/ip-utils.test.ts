import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getClientIp } from "../ip-utils";

const createRequest = (headers: Record<string, string> = {}): Request => {
  return new Request("https://example.com", { headers });
};

const previousVercelEnv = process.env.VERCEL_ENV;
const previousTrustedProxyHops = process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS;

const restoreEnv = (key: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

afterEach(() => {
  restoreEnv("VERCEL_ENV", previousVercelEnv);
  restoreEnv("RATE_LIMIT_TRUSTED_PROXY_HOPS", previousTrustedProxyHops);
});

describe("getClientIp", () => {
  beforeEach(() => {
    delete process.env.VERCEL_ENV;
    delete process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS;
  });

  it("never trusts the spoofable leftmost x-forwarded-for as identity off Vercel", () => {
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("ignores client-supplied x-vercel-forwarded-for off Vercel", () => {
    const request = createRequest({ "x-vercel-forwarded-for": "1.2.3.4" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("ignores client-supplied x-real-ip off Vercel", () => {
    const request = createRequest({ "x-real-ip": "10.0.0.1" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("uses the hop counted from the right matching the configured trusted-proxy depth", () => {
    process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS = "1";
    const request = createRequest({ "x-forwarded-for": "9.9.9.9, 1.2.3.4" });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("uses a deeper trusted-proxy hop when more proxies are declared", () => {
    process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS = "2";
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.9.9.9" });

    expect(getClientIp(request)).toBe("5.6.7.8");
  });

  it("returns 'unknown' when the trusted-proxy depth exceeds the forwarded hops", () => {
    process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS = "5";
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("returns 'unknown' when the trusted-proxy hop is malformed", () => {
    process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS = "1";
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, not-an-ip" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("prefers x-vercel-forwarded-for on Vercel over every other header", () => {
    process.env.VERCEL_ENV = "production";
    const request = createRequest({
      "x-vercel-forwarded-for": "1.2.3.4",
      "x-forwarded-for": "9.9.9.9, 8.8.8.8",
      "x-real-ip": "10.0.0.1",
    });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip on Vercel when x-vercel-forwarded-for is absent", () => {
    process.env.VERCEL_ENV = "production";
    const request = createRequest({ "x-real-ip": "10.0.0.1" });

    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("does not fall back to x-forwarded-for on Vercel when vercel-specific headers are absent", () => {
    process.env.VERCEL_ENV = "production";
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const request = createRequest();

    expect(getClientIp(request)).toBe("unknown");
  });
});
