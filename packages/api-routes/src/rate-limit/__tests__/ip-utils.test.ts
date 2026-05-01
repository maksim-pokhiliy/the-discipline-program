import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getClientIp } from "../ip-utils";

const createRequest = (headers: Record<string, string> = {}): Request => {
  return new Request("https://example.com", { headers });
};

const previousVercelEnv = process.env.VERCEL;

afterEach(() => {
  if (previousVercelEnv === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = previousVercelEnv;
  }
});

describe("getClientIp", () => {
  beforeEach(() => {
    delete process.env.VERCEL;
  });

  it("uses the rightmost x-forwarded-for hop off Vercel (the proxy-attested client)", () => {
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });

    expect(getClientIp(request)).toBe("5.6.7.8");
  });

  it("skips malformed rightmost entries when collapsing x-forwarded-for", () => {
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, not-an-ip" });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("returns 'unknown' when every x-forwarded-for hop is malformed", () => {
    const request = createRequest({ "x-forwarded-for": "not-an-ip, also-not" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("ignores client-supplied x-real-ip when not running on Vercel", () => {
    const request = createRequest({ "x-real-ip": "10.0.0.1" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("prefers x-vercel-forwarded-for on Vercel over every other header", () => {
    process.env.VERCEL = "1";
    const request = createRequest({
      "x-vercel-forwarded-for": "1.2.3.4",
      "x-forwarded-for": "9.9.9.9, 8.8.8.8",
      "x-real-ip": "10.0.0.1",
    });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip on Vercel when x-vercel-forwarded-for is absent", () => {
    process.env.VERCEL = "1";
    const request = createRequest({ "x-real-ip": "10.0.0.1" });

    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("falls back to rightmost x-forwarded-for on Vercel when both vercel-specific headers are absent", () => {
    process.env.VERCEL = "1";
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });

    expect(getClientIp(request)).toBe("5.6.7.8");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const request = createRequest();

    expect(getClientIp(request)).toBe("unknown");
  });
});
