import * as Sentry from "@sentry/nextjs";

import type { MonitoringPort } from "./port";

export const createSentryAdapter = (): MonitoringPort => ({
  captureException: (error, context) => {
    return Sentry.captureException(error, {
      ...(context?.tags && { tags: context.tags }),
      ...(context?.extra && { extra: context.extra }),
      ...(context?.level && { level: context.level }),
      ...(context?.user && { user: context.user }),
    });
  },

  captureMessage: (message, context) => {
    return Sentry.captureMessage(message, {
      ...(context?.tags && { tags: context.tags }),
      ...(context?.extra && { extra: context.extra }),
      level: context?.level ?? "info",
      ...(context?.user && { user: context.user }),
    });
  },

  setUser: (user) => {
    Sentry.setUser(user);
  },

  setContext: (name, context) => {
    Sentry.setContext(name, context);
  },

  flush: (timeout = 2000) => {
    return Sentry.flush(timeout);
  },
});
