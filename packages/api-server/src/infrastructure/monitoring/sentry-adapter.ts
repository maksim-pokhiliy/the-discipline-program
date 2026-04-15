import * as Sentry from "@sentry/nextjs";

import type { MonitoringPort } from "./port";

export const createSentryAdapter = (): MonitoringPort => ({
  captureException: (error, context) => {
    return Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level,
      user: context?.user,
    });
  },

  captureMessage: (message, context) => {
    return Sentry.captureMessage(message, {
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level ?? "info",
      user: context?.user,
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
