import { InternalServerError, TimeoutError } from "@repo/errors";

const BASE_RETRY_DELAY_MS = 1_000;
const EXPONENTIAL_BACKOFF_BASE = 2;

export const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

export const computeBackoffDelay = (attempt: number): number => {
  return (
    BASE_RETRY_DELAY_MS * EXPONENTIAL_BACKOFF_BASE ** (attempt - 1) +
    Math.random() * BASE_RETRY_DELAY_MS
  );
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export type TransportErrorOutcome =
  | { kind: "retry"; error: Error }
  | { kind: "throw"; error: unknown };

export const classifyTransportError = (
  error: unknown,
  fullUrl: string,
  attempt: number,
  maxRetries: number,
  timeoutMs: number,
): TransportErrorOutcome => {
  if (error instanceof Error && error.name === "AbortError") {
    const timeoutError = new TimeoutError(`Request timed out after ${timeoutMs}ms`, {
      url: fullUrl,
      timeoutMs,
    });

    if (attempt < maxRetries) {
      return { kind: "retry", error: timeoutError };
    }

    return { kind: "throw", error: timeoutError };
  }

  if (error instanceof TypeError && attempt < maxRetries) {
    return { kind: "retry", error };
  }

  return { kind: "throw", error };
};

export const buildRetryBudgetExhaustedError = (
  fullUrl: string,
  maxTotalDurationMs: number,
  elapsedMs?: number,
): InternalServerError => {
  return new InternalServerError("Request retry budget exhausted", {
    url: fullUrl,
    maxTotalDurationMs,
    ...(elapsedMs !== undefined && { elapsedMs }),
  });
};
