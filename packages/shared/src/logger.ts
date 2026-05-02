type LogLevel = "info" | "warn" | "error" | "debug";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const isLogLevel = (value: string): value is LogLevel =>
  value === "debug" || value === "info" || value === "warn" || value === "error";

let configuredMinLevel: LogLevel = "debug";

export const setLoggerMinLevel = (level: LogLevel): void => {
  configuredMinLevel = level;
};

const resolveMinLogLevel = (): LogLevel => configuredMinLevel;

type LogContext = Record<string, unknown>;

type ContextProvider = () => LogContext | undefined;

let contextProvider: ContextProvider | undefined;

export const setLoggerContextProvider = (provider: ContextProvider): void => {
  contextProvider = provider;
};

type LogData = Record<string, unknown>;

type LogEntry = {
  level: LogLevel;
  msg: string;
  service?: string;
  environment?: string;
  timestamp: string;
  [key: string]: unknown;
};

type LoggerConfig = {
  service?: string;
  environment?: string;
  defaultMeta?: LogData;
};

export type Logger = {
  info: (msg: string, data?: LogData) => void;
  warn: (msg: string, data?: LogData) => void;
  error: (msg: string, data?: LogData) => void;
  debug: (msg: string, data?: LogData) => void;
  child: (config: LoggerConfig) => Logger;
};

const REDACTED_KEYS = new Set<string>([
  "password",
  "passwordhash",
  "passwordhashed",
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "apikey",
  "secret",
  "authorization",
  "cookie",
  "creditcard",
  "ssn",
  "email",
  "phone",
  "phonenumber",
  "address",
  "firstname",
  "lastname",
  "fullname",
  "dob",
  "dateofbirth",
  "ip",
  "ipaddress",
  "taxid",
]);

const REDACTED_VALUE = "[REDACTED]";

const hasSensitiveField = (obj: unknown, visited: WeakSet<object>): boolean => {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return false;
  }

  if (visited.has(obj)) {
    return false;
  }

  visited.add(obj);

  if (Array.isArray(obj)) {
    return obj.some((item) => hasSensitiveField(item, visited));
  }

  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      return true;
    }

    if (hasSensitiveField(value, visited)) {
      return true;
    }
  }

  return false;
};

const redact = (value: unknown, visited: WeakSet<object>): unknown => {
  if (value === null || value === undefined || typeof value !== "object") {
    return value;
  }

  if (visited.has(value)) {
    return "[Circular]";
  }

  visited.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, visited));
  }

  const result: Record<string, unknown> = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      result[key] = REDACTED_VALUE;
    } else {
      result[key] = redact(fieldValue, visited);
    }
  }

  return result;
};

export function redactPii<T extends Record<string, unknown>>(value: T): T;
export function redactPii<T extends Record<string, unknown>>(value: T | undefined): T | undefined;
export function redactPii(value: unknown): unknown;
export function redactPii(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== "object") {
    return value;
  }

  if (!hasSensitiveField(value, new WeakSet<object>())) {
    return value;
  }

  return redact(value, new WeakSet<object>());
}

const createLogEntry = (
  level: LogLevel,
  msg: string,
  config: LoggerConfig,
  data?: LogData,
): LogEntry => {
  const ctx = contextProvider?.();
  const safeData = redactPii(data);
  const safeDefaultMeta = redactPii(config.defaultMeta);

  return {
    level,
    msg,
    ...(config.service && { service: config.service }),
    ...(config.environment && { environment: config.environment }),
    ...safeDefaultMeta,
    ...ctx,
    ...safeData,
    timestamp: new Date().toISOString(),
  };
};

const LOG_METHODS: Record<LogLevel, (...args: unknown[]) => void> = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

export const createLogger = (config: LoggerConfig = {}): Logger => {
  const log = (level: LogLevel, msg: string, data?: LogData): void => {
    const minLevel = resolveMinLogLevel();

    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLevel]) {
      return;
    }

    const entry = createLogEntry(level, msg, config, data);

    LOG_METHODS[level](JSON.stringify(entry));
  };

  return {
    info: (msg, data) => log("info", msg, data),
    warn: (msg, data) => log("warn", msg, data),
    error: (msg, data) => log("error", msg, data),
    debug: (msg, data) => log("debug", msg, data),
    child: (childConfig) =>
      createLogger({
        ...config,
        ...childConfig,
        defaultMeta: { ...config.defaultMeta, ...childConfig.defaultMeta },
      }),
  };
};

export const logger: Logger = createLogger();
