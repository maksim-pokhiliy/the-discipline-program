import * as Sentry from "@sentry/nextjs";
import { describe, expect, it, vi } from "vitest";

import { createNoopAdapter } from "./noop-adapter";
import { createSentryAdapter } from "./sentry-adapter";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(() => "sentry-event-id-1"),
  captureMessage: vi.fn(() => "sentry-event-id-2"),
  setUser: vi.fn(),
  setContext: vi.fn(),
  flush: vi.fn(() => Promise.resolve(true)),
}));

describe("createNoopAdapter", () => {
  const adapter = createNoopAdapter();

  it("captureException returns empty string", () => {
    expect(adapter.captureException(new Error("boom"))).toBe("");
  });

  it("captureMessage returns empty string", () => {
    expect(adapter.captureMessage("test")).toBe("");
  });

  it("setUser is callable without throwing", () => {
    expect(() => adapter.setUser({ id: "u1" })).not.toThrow();
    expect(() => adapter.setUser(null)).not.toThrow();
  });

  it("setContext is callable without throwing", () => {
    expect(() => adapter.setContext("req", { path: "/api" })).not.toThrow();
  });

  it("flush resolves to true", async () => {
    await expect(adapter.flush()).resolves.toBe(true);
  });
});

describe("createSentryAdapter", () => {
  const adapter = createSentryAdapter();

  it("captureException delegates to Sentry.captureException", () => {
    const error = new Error("test error");
    const context = { tags: { route: "/api/test" }, extra: { userId: "u1" } };

    const result = adapter.captureException(error, context);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: context.tags,
      extra: context.extra,
      level: undefined,
      user: undefined,
    });
    expect(result).toBe("sentry-event-id-1");
  });

  it("captureMessage delegates to Sentry.captureMessage", () => {
    const context = { level: "warning" as const, tags: { env: "prod" } };

    const result = adapter.captureMessage("something happened", context);

    expect(Sentry.captureMessage).toHaveBeenCalledWith("something happened", {
      tags: context.tags,
      extra: undefined,
      level: "warning",
      user: undefined,
    });
    expect(result).toBe("sentry-event-id-2");
  });

  it("setUser delegates to Sentry.setUser", () => {
    const user = { id: "u1", email: "test@example.com", role: "ADMIN" };

    adapter.setUser(user);

    expect(Sentry.setUser).toHaveBeenCalledWith(user);
  });

  it("setContext delegates to Sentry.setContext", () => {
    adapter.setContext("request", { path: "/api/users", method: "GET" });

    expect(Sentry.setContext).toHaveBeenCalledWith("request", {
      path: "/api/users",
      method: "GET",
    });
  });

  it("flush delegates to Sentry.flush", async () => {
    await adapter.flush(5000);

    expect(Sentry.flush).toHaveBeenCalledWith(5000);
  });
});
