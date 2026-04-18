import { describe, expect, it } from "vitest";

import { getClientIp } from "../ip-utils";

const createRequest = (headers: Record<string, string> = {}): Request => {
  return new Request("https://example.com", { headers });
};

describe("getClientIp", () => {
  it("prefers x-real-ip over x-forwarded-for", () => {
    const request = createRequest({
      "x-real-ip": "10.0.0.1",
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });

    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("uses x-real-ip when it is the only header present", () => {
    const request = createRequest({ "x-real-ip": "10.0.0.1" });

    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("extracts the rightmost IP from x-forwarded-for when x-real-ip is absent", () => {
    const request = createRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });

    expect(getClientIp(request)).toBe("5.6.7.8");
  });

  it("trims whitespace from the rightmost entry of x-forwarded-for", () => {
    const request = createRequest({ "x-forwarded-for": "1.2.3.4 , 5.6.7.8  " });

    expect(getClientIp(request)).toBe("5.6.7.8");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const request = createRequest();

    expect(getClientIp(request)).toBe("unknown");
  });
});
