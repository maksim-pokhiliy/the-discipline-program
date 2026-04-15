import { describe, expect, it } from "vitest";

import { getClientIp } from "../ip-utils";

const createRequest = (headers: Record<string, string> = {}): Request => {
  return new Request("https://example.com", { headers });
};

describe("getClientIp", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("trims whitespace from x-forwarded-for", () => {
    const request = createRequest({ "x-forwarded-for": "  1.2.3.4 , 5.6.7.8" });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const request = createRequest({ "x-real-ip": "10.0.0.1" });

    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const request = createRequest();

    expect(getClientIp(request)).toBe("unknown");
  });
});
