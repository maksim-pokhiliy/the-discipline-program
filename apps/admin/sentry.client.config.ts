import { createSentryClientInit } from "@repo/shared/sentry";

const isProduction = process.env.NODE_ENV === "production";

const initSentryClient = createSentryClientInit({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: isProduction ? 1.0 : 0,
});

initSentryClient();
