import { describe, expect, it } from "vitest";

import { MOBILE_RECONNECT_REQUIRED } from "@repo/contracts/coaching/mobile-publish";

import { isReconnectRequired } from "./is-reconnect-required";

class ErrorWithDetails extends Error {
  public readonly details: { reason?: unknown };

  public constructor(message: string, details: { reason?: unknown }) {
    super(message);
    this.details = details;
  }
}

describe("isReconnectRequired", () => {
  it("is true for an Error whose details.reason is MOBILE_RECONNECT_REQUIRED", () => {
    const error = new ErrorWithDetails("Session expired", { reason: MOBILE_RECONNECT_REQUIRED });

    expect(isReconnectRequired(error)).toBe(true);
  });

  it("is false for a plain Error with no details", () => {
    expect(isReconnectRequired(new Error("boom"))).toBe(false);
  });

  it("is false for an Error whose details.reason is a different reason", () => {
    const error = new ErrorWithDetails("nope", { reason: "SOMETHING_ELSE" });

    expect(isReconnectRequired(error)).toBe(false);
  });

  it("is false for an Error whose details has no reason", () => {
    const error = new ErrorWithDetails("nope", {});

    expect(isReconnectRequired(error)).toBe(false);
  });

  it("is false for a non-Error value carrying the reason", () => {
    expect(isReconnectRequired({ details: { reason: MOBILE_RECONNECT_REQUIRED } })).toBe(false);
  });

  it("is false for null and undefined", () => {
    expect(isReconnectRequired(null)).toBe(false);
    expect(isReconnectRequired(undefined)).toBe(false);
  });
});
