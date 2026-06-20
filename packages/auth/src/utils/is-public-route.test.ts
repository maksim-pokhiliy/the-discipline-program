import { describe, expect, it } from "vitest";

import { isPublicRoute } from "./is-public-route";

describe("isPublicRoute", () => {
  it("treats the login route as public", () => {
    expect(isPublicRoute("/login")).toBe(true);
  });

  it("treats the invite claim flow as public", () => {
    expect(isPublicRoute("/invite")).toBe(true);
    expect(isPublicRoute("/invite/abc123")).toBe(true);
  });

  it("treats the forgot-password page as public", () => {
    expect(isPublicRoute("/forgot-password")).toBe(true);
  });

  it("treats the reset-password token page as public", () => {
    expect(isPublicRoute("/reset-password")).toBe(true);
    expect(isPublicRoute("/reset-password/abc123")).toBe(true);
  });

  it("treats the auth api namespace as public", () => {
    expect(isPublicRoute("/api/auth")).toBe(true);
    expect(isPublicRoute("/api/auth/password-reset/request")).toBe(true);
  });

  it("keeps protected app routes private", () => {
    expect(isPublicRoute("/athlete")).toBe(false);
    expect(isPublicRoute("/coach")).toBe(false);
  });

  it("does not over-match near-miss paths outside the public prefixes", () => {
    expect(isPublicRoute("/forgot-password-elsewhere")).toBe(false);
    expect(isPublicRoute("/reset-passwordx")).toBe(false);
  });
});
