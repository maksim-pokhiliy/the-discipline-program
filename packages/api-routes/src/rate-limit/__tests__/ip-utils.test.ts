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

  it("uses the leftmost x-forwarded-for hop as the client IP", () => {
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("trims whitespace around the leftmost x-forwarded-for entry", () => {
    const request = createRequest({ "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("rejects malformed x-forwarded-for entries that are not valid IPs", () => {
    const request = createRequest({ "x-forwarded-for": "not-an-ip, 1.2.3.4" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("ignores client-supplied x-real-ip when not running on Vercel", () => {
    const request = createRequest({ "x-real-ip": "10.0.0.1" });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("trusts x-real-ip when running on Vercel and x-forwarded-for is absent", () => {
    process.env.VERCEL = "1";
    const request = createRequest({ "x-real-ip": "10.0.0.1" });

    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("prefers the leftmost x-forwarded-for hop over x-real-ip on Vercel", () => {
    process.env.VERCEL = "1";
    const request = createRequest({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      "x-real-ip": "10.0.0.1",
    });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const request = createRequest();

    expect(getClientIp(request)).toBe("unknown");
  });
});
