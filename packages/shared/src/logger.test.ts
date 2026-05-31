import { afterEach, describe, expect, it, vi } from "vitest";

const { logMock, warnMock, errorMock, debugMock } = vi.hoisted(() => {
  const logMock = vi.fn();
  const warnMock = vi.fn();
  const errorMock = vi.fn();
  const debugMock = vi.fn();

  globalThis.console = {
    ...globalThis.console,
    log: logMock,
    warn: warnMock,
    error: errorMock,
    debug: debugMock,
  };

  return { logMock, warnMock, errorMock, debugMock };
});

import { createLogger, logger, redactPii } from "./logger";

describe("default logger", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("info calls console.log with JSON containing level, msg, data, and timestamp", () => {
    logger.info("msg", { k: "v" });

    expect(logMock).toHaveBeenCalledOnce();

    const entry = JSON.parse(String(logMock.mock.calls.at(0)?.at(0)));

    expect(entry).toMatchObject({ level: "info", msg: "msg", k: "v" });
    expect(entry.timestamp).toBeDefined();
  });

  it("warn calls console.warn", () => {
    logger.warn("warning");

    expect(warnMock).toHaveBeenCalledOnce();

    const entry = JSON.parse(String(warnMock.mock.calls.at(0)?.at(0)));

    expect(entry).toMatchObject({ level: "warn", msg: "warning" });
  });

  it("error calls console.error", () => {
    logger.error("failure");

    expect(errorMock).toHaveBeenCalledOnce();

    const entry = JSON.parse(String(errorMock.mock.calls.at(0)?.at(0)));

    expect(entry).toMatchObject({ level: "error", msg: "failure" });
  });

  it("debug calls console.debug", () => {
    logger.debug("trace");

    expect(debugMock).toHaveBeenCalledOnce();

    const entry = JSON.parse(String(debugMock.mock.calls.at(0)?.at(0)));

    expect(entry).toMatchObject({ level: "debug", msg: "trace" });
  });
});

describe("createLogger with config", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("output includes service field when configured", () => {
    const l = createLogger({ service: "test" });

    l.info("hello");

    expect(logMock).toHaveBeenCalledOnce();

    const entry = JSON.parse(String(logMock.mock.calls.at(0)?.at(0)));

    expect(entry).toMatchObject({ level: "info", msg: "hello", service: "test" });
  });
});

describe("child", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("output includes child service field", () => {
    const parent = createLogger({ service: "parent" });
    const child = parent.child({ service: "child" });

    child.info("from child");

    expect(logMock).toHaveBeenCalledOnce();

    const entry = JSON.parse(String(logMock.mock.calls.at(0)?.at(0)));

    expect(entry).toMatchObject({ level: "info", msg: "from child", service: "child" });
  });
});

describe("backward compatibility", () => {
  it("logger export has info, warn, error methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });
});

describe("redactPii", () => {
  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "idToken",
    "apiKey",
    "secret",
    "authorization",
    "cookie",
    "creditCard",
    "ssn",
    "email",
    "phone",
    "phoneNumber",
    "address",
    "firstName",
    "lastName",
    "fullName",
    "dob",
    "dateOfBirth",
    "ip",
    "ipAddress",
    "taxId",
  ];

  it.each(sensitiveKeys)("redacts the value under the sensitive key %s", (key) => {
    expect(redactPii({ [key]: "raw-value" })).toEqual({ [key]: "[REDACTED]" });
  });

  it("matches keys case-insensitively", () => {
    expect(redactPii({ EMAIL: "user@example.com", Token: "abc" })).toEqual({
      EMAIL: "[REDACTED]",
      Token: "[REDACTED]",
    });
  });

  it("leaves non-sensitive keys untouched", () => {
    expect(redactPii({ email: "user@example.com", role: "ADMIN", count: 3 })).toEqual({
      email: "[REDACTED]",
      role: "ADMIN",
      count: 3,
    });
  });

  it("redacts sensitive keys in nested objects", () => {
    expect(redactPii({ user: { email: "user@example.com", id: "u1" } })).toEqual({
      user: { email: "[REDACTED]", id: "u1" },
    });
  });

  it("redacts sensitive keys inside arrays", () => {
    expect(redactPii({ users: [{ email: "a@b.com" }, { email: "c@d.com" }] })).toEqual({
      users: [{ email: "[REDACTED]" }, { email: "[REDACTED]" }],
    });
  });

  it("returns the original reference when no sensitive field is present (short-circuit)", () => {
    const input = { role: "ADMIN", nested: { count: 1 } };

    expect(redactPii(input)).toBe(input);
  });

  it("does not throw and renders [Circular] on circular references", () => {
    const input: Record<string, unknown> = { email: "user@example.com" };

    input.self = input;

    const result = redactPii(input) as Record<string, unknown>;

    expect(result.email).toBe("[REDACTED]");
    expect(result.self).toBe("[Circular]");
  });

  it("passes primitives through unchanged", () => {
    expect(redactPii("user@example.com")).toBe("user@example.com");
    expect(redactPii(null)).toBeNull();
    expect(redactPii(undefined)).toBeUndefined();
  });

  it("does NOT redact PII embedded in a value under a non-sensitive key (key-based, not value-based)", () => {
    expect(redactPii({ message: "failed for user@example.com" })).toEqual({
      message: "failed for user@example.com",
    });
    expect(redactPii({ reason: "duplicate key for John Doe" })).toEqual({
      reason: "duplicate key for John Doe",
    });
  });
});
