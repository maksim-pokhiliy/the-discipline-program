export type SentryServerInitOptions = {
  dsn: string | undefined;
  environment: string;
  tracesSampleRate: number;
  debug?: boolean;
};

export type ServerInstrumentationOptions = {
  sentry: SentryServerInitOptions;
  setupDI?: () => Promise<void>;
};

export const createSentryServerRegister = (options: ServerInstrumentationOptions) => {
  const { sentry, setupDI } = options;

  return async (): Promise<void> => {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      const Sentry = await import("@sentry/nextjs");

      Sentry.init({
        dsn: sentry.dsn,
        environment: sentry.environment,
        tracesSampleRate: sentry.tracesSampleRate,
        debug: sentry.debug ?? false,
      });

      if (setupDI) {
        await setupDI();
      }
    }

    if (process.env.NEXT_RUNTIME === "edge") {
      const Sentry = await import("@sentry/nextjs");

      Sentry.init({
        dsn: sentry.dsn,
        environment: sentry.environment,
        tracesSampleRate: sentry.tracesSampleRate,
        debug: sentry.debug ?? false,
      });
    }
  };
};
