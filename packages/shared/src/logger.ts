type LogLevel = "info" | "warn" | "error" | "debug";

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

const createLogEntry = (
  level: LogLevel,
  msg: string,
  config: LoggerConfig,
  data?: LogData,
): LogEntry => ({
  level,
  msg,
  ...(config.service && { service: config.service }),
  ...(config.environment && { environment: config.environment }),
  ...config.defaultMeta,
  ...data,
  timestamp: new Date().toISOString(),
});

const LOG_METHODS: Record<LogLevel, (...args: unknown[]) => void> = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

export const createLogger = (config: LoggerConfig = {}): Logger => {
  const log = (level: LogLevel, msg: string, data?: LogData): void => {
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
