import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

export const initSentryServer = (): void => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    debug: false,
  });
};
