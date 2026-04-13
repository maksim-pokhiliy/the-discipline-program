type LogData = Record<string, unknown>;

type Logger = {
  info: (msg: string, data?: LogData) => void;
  warn: (msg: string, data?: LogData) => void;
  error: (msg: string, data?: LogData) => void;
};

const formatLog = (level: string, msg: string, data?: LogData): string =>
  JSON.stringify({ level, msg, ...data, timestamp: new Date().toISOString() });

export const logger: Logger = {
  info: (msg, data) => console.log(formatLog("info", msg, data)),
  warn: (msg, data) => console.warn(formatLog("warn", msg, data)),
  error: (msg, data) => console.error(formatLog("error", msg, data)),
};
