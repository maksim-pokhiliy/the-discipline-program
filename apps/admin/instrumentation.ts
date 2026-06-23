import { createSentryRequestErrorHandler } from "@repo/shared/sentry";

export const onRequestError = createSentryRequestErrorHandler();

export const register = async (): Promise<void> => {
  const isProd = process.env.NODE_ENV === "production";

  const sentryConfig = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: isProd ? 0.1 : 1.0,
    debug: false,
  };

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init(sentryConfig);

    const { bootstrapBackendDI } = await import("@repo/api-server/instrumentation");

    await bootstrapBackendDI();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init(sentryConfig);
  }
};
