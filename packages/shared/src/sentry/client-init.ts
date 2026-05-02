import * as Sentry from "@sentry/nextjs";

export type SentryClientInitOptions = {
  dsn: string | undefined;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  debug?: boolean;
};

export const createSentryClientInit = (options: SentryClientInitOptions): (() => void) => {
  return () => {
    if (!options.dsn) {
      return;
    }

    Sentry.init({
      dsn: options.dsn,
      environment: options.environment,
      tracesSampleRate: options.tracesSampleRate,
      replaysSessionSampleRate: options.replaysSessionSampleRate,
      replaysOnErrorSampleRate: options.replaysOnErrorSampleRate,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        }),
      ],
      debug: options.debug ?? false,
    });
  };
};
