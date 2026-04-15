import { createNoopAdapter } from "./noop-adapter";
import { createSentryAdapter } from "./sentry-adapter";

export type { CaptureContext, MonitoringPort, SeverityLevel } from "./port";
export { createNoopAdapter } from "./noop-adapter";
export { createSentryAdapter } from "./sentry-adapter";

const hasSentryDsn = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export const defaultMonitoring = hasSentryDsn ? createSentryAdapter() : createNoopAdapter();
