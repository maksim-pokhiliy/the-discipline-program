import { MOBILE_RECONNECT_REQUIRED } from "@repo/contracts/coaching/mobile-publish";

export const isReconnectRequired = (error: unknown): boolean =>
  error instanceof Error &&
  (error as { details?: { reason?: unknown } }).details?.reason === MOBILE_RECONNECT_REQUIRED;
