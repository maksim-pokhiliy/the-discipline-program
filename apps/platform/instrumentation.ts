import { bootstrapBackendDI } from "@repo/api-server/instrumentation";
import { createSentryRequestErrorHandler, createSentryServerRegister } from "@repo/shared/sentry";

export const register = createSentryServerRegister({
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  },
  setupDI: bootstrapBackendDI,
});

export const onRequestError = createSentryRequestErrorHandler();
