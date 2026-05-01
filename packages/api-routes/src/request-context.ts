import { AsyncLocalStorage } from "node:async_hooks";

import { isLogLevel, setLoggerContextProvider, setLoggerMinLevel } from "@repo/shared";

export type RequestContext = {
  requestId: string;
  userId?: string;
  role?: string;
  sessionId?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithContext = <T>(context: RequestContext, fn: () => T): T =>
  storage.run(context, fn);

export const getContext = (): RequestContext | undefined => storage.getStore();

export const getRequestId = (): string | undefined => storage.getStore()?.requestId;

export const getUserId = (): string | undefined => storage.getStore()?.userId;

export const updateContext = (patch: Partial<RequestContext>): void => {
  const current = storage.getStore();

  if (!current) {
    return;
  }

  Object.assign(current, patch);
};

setLoggerContextProvider(() => {
  const ctx = storage.getStore();

  if (!ctx) {
    return undefined;
  }

  return {
    requestId: ctx.requestId,
    ...(ctx.userId && { userId: ctx.userId }),
    ...(ctx.role && { role: ctx.role }),
  };
});

const envLevel = process.env.LOG_LEVEL?.toLowerCase();

if (envLevel && isLogLevel(envLevel)) {
  setLoggerMinLevel(envLevel);
} else if (process.env.NODE_ENV === "production") {
  setLoggerMinLevel("info");
}
