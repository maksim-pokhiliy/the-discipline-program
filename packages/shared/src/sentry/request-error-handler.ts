type RequestErrorParams = {
  error: { digest: string } & Error;
  request: { path: string; method: string; headers: Record<string, string> };
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string };
};

export type SentryRequestErrorHandler = (
  error: RequestErrorParams["error"],
  request: RequestErrorParams["request"],
  context: RequestErrorParams["context"],
) => Promise<void>;

export const createSentryRequestErrorHandler = (): SentryRequestErrorHandler => {
  return async (error, request, context) => {
    const Sentry = await import("@sentry/nextjs");

    Sentry.captureException(error, {
      tags: {
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        renderSource: context.renderSource,
      },
      extra: {
        path: request.path,
        method: request.method,
      },
    });
  };
};
