import { createSentryRequestErrorHandler } from "@repo/shared/sentry";

export const onRequestError = createSentryRequestErrorHandler();

export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    const { bootstrapBackendDI } = await import("@repo/api-server/instrumentation");

    await bootstrapBackendDI();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
};
