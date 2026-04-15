export type SeverityLevel = "fatal" | "error" | "warning" | "info" | "debug";

export type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: SeverityLevel;
  user?: { id: string; email?: string; role?: string };
};

export type MonitoringPort = {
  captureException(error: unknown, context?: CaptureContext): string;
  captureMessage(message: string, context?: CaptureContext): string;
  setUser(user: { id: string; email?: string; role?: string } | null): void;
  setContext(name: string, context: Record<string, unknown>): void;
  flush(timeout?: number): Promise<boolean>;
};

let monitoring: MonitoringPort | undefined;

export const setMonitoring = (port: MonitoringPort): void => {
  monitoring = port;
};

export const getMonitoring = (): MonitoringPort | undefined => {
  return monitoring;
};
