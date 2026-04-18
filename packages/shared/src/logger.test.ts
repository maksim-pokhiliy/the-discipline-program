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

import { createLogger, logger } from "./logger";

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
